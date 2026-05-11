import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSchedule, ScheduleAssignment } from "@/lib/scheduling";
import { sendScheduleConfirmationEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { confirm, sendNotifications } = await request.json();

    // Fetch the pickleball fixture
    const fixture = await prisma.fixture.findUnique({
      where: { sport: "PICKLEBALL" },
      include: { matches: true },
    });

    if (!fixture) {
      return NextResponse.json(
        { error: "Pickleball fixture not found" },
        { status: 404 }
      );
    }

    // Map matches to the scheduling engine's expected format
    const matchesForScheduling = fixture.matches.map((m) => ({
      id: m.id,
      category: m.category || "",
      roundNumber: m.roundNumber,
      entry1Id: m.entry1Id,
      entry2Id: m.entry2Id,
    }));

    // Generate the schedule
    const { assignments, conflicts } = generateSchedule(matchesForScheduling);

    if (!confirm) {
      // Preview mode: return proposed assignments and summary
      const summary = buildSummary(assignments);
      return NextResponse.json({
        assignments,
        conflicts,
        summary,
      });
    }

    // Confirm mode: persist assignments to the database using a transaction
    let scheduled = 0;
    await prisma.$transaction(
      assignments.map((assignment) =>
        prisma.match.update({
          where: { id: assignment.matchId },
          data: {
            scheduledDate: assignment.scheduledDate,
            venue: assignment.court,
          },
        })
      )
    );
    scheduled = assignments.length;

    // Handle notifications
    let notified = 0;
    if (sendNotifications) {
      // Only notify matches where both entries are confirmed (not WINNER_ placeholders)
      const confirmedMatchIds = assignments
        .filter((a) => {
          const match = fixture.matches.find((m) => m.id === a.matchId);
          if (!match) return false;
          return (
            match.entry1Id &&
            match.entry2Id &&
            !match.entry1Id.startsWith("WINNER_") &&
            !match.entry2Id.startsWith("WINNER_")
          );
        })
        .map((a) => a.matchId);

      if (confirmedMatchIds.length > 0) {
        const result = await sendScheduleConfirmationEmails(confirmedMatchIds);
        notified = result.sent;
      }
    }

    return NextResponse.json({ scheduled, notified });
  } catch (err) {
    console.error("[admin/fixtures/auto-schedule POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function buildSummary(assignments: ScheduleAssignment[]) {
  const byDay: Record<string, number> = {};
  const byCourt: Record<string, number> = {};

  for (const a of assignments) {
    // Extract date from scheduledDate
    const dateStr = a.scheduledDate.toISOString().split("T")[0];
    byDay[dateStr] = (byDay[dateStr] || 0) + 1;

    byCourt[a.court] = (byCourt[a.court] || 0) + 1;
  }

  return {
    totalMatches: assignments.length,
    byDay,
    byCourt,
  };
}
