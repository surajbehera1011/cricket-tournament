import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMatchScheduledEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";
import { validateAssignment, extractSlotInfo } from "@/lib/scheduling";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchId, scheduledDate, venue, sendNotification } =
      await request.json();
    if (!matchId) {
      return NextResponse.json(
        { error: "matchId required" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { fixture: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Conflict validation when assigning a court + time
    if (scheduledDate && venue) {
      const proposedDate = new Date(scheduledDate);
      const slotInfo = extractSlotInfo(proposedDate);

      if (slotInfo) {
        // Get all other scheduled matches in this fixture
        const allMatches = await prisma.match.findMany({
          where: { fixtureId: match.fixtureId, scheduledDate: { not: null }, venue: { not: null } },
          select: { id: true, category: true, roundNumber: true, entry1Id: true, entry2Id: true, scheduledDate: true, venue: true },
        });

        const existingAssignments = allMatches
          .filter((m) => m.id !== matchId && m.scheduledDate && m.venue)
          .map((m) => ({ matchId: m.id, court: m.venue!, scheduledDate: m.scheduledDate! }));

        const matchForValidation = {
          id: matchId,
          category: match.category || "",
          roundNumber: match.roundNumber,
          entry1Id: match.entry1Id,
          entry2Id: match.entry2Id,
        };

        const allMatchesForValidation = allMatches.map((m) => ({
          id: m.id,
          category: m.category || "",
          roundNumber: m.roundNumber,
          entry1Id: m.entry1Id,
          entry2Id: m.entry2Id,
        }));
        allMatchesForValidation.push(matchForValidation);

        const conflicts = validateAssignment(
          { matchId, court: venue, scheduledDate: proposedDate },
          existingAssignments,
          allMatchesForValidation
        );

        if (conflicts.length > 0) {
          return NextResponse.json(
            { error: "Schedule conflict", conflicts },
            { status: 409 }
          );
        }
      }
    }

    const data: Record<string, unknown> = {};
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
    if (scheduledDate === null) data.scheduledDate = null;
    if (venue !== undefined) data.venue = venue;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    if (sendNotification && updated.scheduledDate && updated.venue) {
      await sendMatchScheduledEmail(updated);
      await prisma.match.update({
        where: { id: matchId },
        data: { notificationSent: true },
      });
    }

    notifyAllAdmins({
      title: "Match Scheduled",
      message: `Match #${updated.matchNumber} (R${updated.roundNumber}) scheduled${updated.venue ? ` at ${updated.venue}` : ""}.`,
      link: "/admin/fixtures",
    }).catch(() => {});

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("[admin/fixtures/schedule POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
