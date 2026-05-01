import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMatchScheduledEmail } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchIds, scheduledDate, venue, sendNotification } =
      await request.json();
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: "matchIds array required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
    if (venue !== undefined) data.venue = venue;

    await prisma.match.updateMany({
      where: { id: { in: matchIds } },
      data,
    });

    if (sendNotification) {
      const matches = await prisma.match.findMany({
        where: { id: { in: matchIds } },
        include: { fixture: true },
      });
      for (const match of matches) {
        if (match.scheduledDate && match.venue && !match.notificationSent) {
          await sendMatchScheduledEmail(match);
          await prisma.match.update({
            where: { id: match.id },
            data: { notificationSent: true },
          });
        }
      }
    }

    notifyAllAdmins({
      title: "Matches Bulk Scheduled",
      message: `${matchIds.length} match(es) scheduled${venue ? ` at ${venue}` : ""}.`,
      link: "/admin/fixtures",
    }).catch(() => {});

    return NextResponse.json({ updated: matchIds.length });
  } catch (err) {
    console.error("[admin/fixtures/bulk-schedule POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
