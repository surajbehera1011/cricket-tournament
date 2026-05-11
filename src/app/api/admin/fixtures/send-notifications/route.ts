import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendScheduleConfirmationEmails } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/fixtures/send-notifications
 * 
 * Sends schedule notification emails for pickleball matches where:
 * - Both players are confirmed (not WINNER_ placeholders)
 * - Match has a scheduledDate and venue assigned
 * - notificationSent is false (not already sent)
 * 
 * Processes in batches of 5 to avoid Vercel timeout.
 * Returns { sent, failed, remaining } so the frontend can call again if remaining > 0.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || 5; // Process 5 at a time to stay within timeout

    // Find all pickleball matches that need notifications
    const matchesNeedingNotification = await prisma.match.findMany({
      where: {
        sport: "PICKLEBALL",
        scheduledDate: { not: null },
        venue: { not: null },
        notificationSent: false,
        // Both entries must be real player IDs (not WINNER_ placeholders)
        entry1Id: { not: null },
        entry2Id: { not: null },
      },
      select: { id: true, entry1Id: true, entry2Id: true },
      orderBy: { scheduledDate: "asc" },
    });

    // Filter out matches where entries are WINNER_ placeholders (Prisma can't filter by prefix)
    const confirmedMatches = matchesNeedingNotification.filter(
      (m) =>
        m.entry1Id &&
        m.entry2Id &&
        !m.entry1Id.startsWith("WINNER_") &&
        !m.entry2Id.startsWith("WINNER_")
    );

    if (confirmedMatches.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, remaining: 0, message: "No pending notifications" });
    }

    // Take only a batch to avoid timeout
    const batch = confirmedMatches.slice(0, batchSize);
    const batchIds = batch.map((m) => m.id);

    // Send emails for this batch
    const result = await sendScheduleConfirmationEmails(batchIds);

    const remaining = confirmedMatches.length - batchSize;

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      remaining: Math.max(0, remaining),
      total: confirmedMatches.length,
      message: remaining > 0
        ? `Sent ${result.sent} emails. ${remaining} more pending — click again to send next batch.`
        : `All ${result.sent} emails sent successfully!`,
    });
  } catch (err) {
    console.error("[admin/fixtures/send-notifications POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
