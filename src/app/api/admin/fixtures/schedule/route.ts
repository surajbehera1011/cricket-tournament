import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMatchScheduledEmail } from "@/lib/email";

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

    const data: Record<string, unknown> = {};
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
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

    return NextResponse.json({ match: updated });
  } catch (err) {
    console.error("[admin/fixtures/schedule POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
