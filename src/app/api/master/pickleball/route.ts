export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPickleballApprovedEmail, sendPickleballRejectedEmail } from "@/lib/email";
import { autoRegeneratePickleballFixture } from "@/lib/fixture-auto-regen";
import { notifyAllAdmins } from "@/lib/notifications";
import { decryptEmail } from "@/lib/crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalPending = await prisma.pickleballRegistration.count({
      where: { status: "PENDING_APPROVAL" },
    });

    const registration = await prisma.pickleballRegistration.findFirst({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "asc" },
    });

    const decrypted = registration
      ? { ...registration, player1Email: decryptEmail(registration.player1Email) || "", player2Email: decryptEmail(registration.player2Email) }
      : null;
    return NextResponse.json({ registration: decrypted, totalPending });
  } catch (error) {
    console.error("Master pickleball GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, action } = await request.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request. Only approve/reject allowed." }, { status: 400 });
    }

    const reg = await prisma.pickleballRegistration.findUnique({ where: { id } });
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (reg.status !== "PENDING_APPROVAL") {
      return NextResponse.json({ error: "Registration already processed" }, { status: 400 });
    }

    const rP1 = decryptEmail(reg.player1Email) || "";
    const rP2 = decryptEmail(reg.player2Email);

    if (action === "approve") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "APPROVED" } });
      sendPickleballApprovedEmail(rP1, reg.player1Name, reg.category, rP2, reg.player2Name);
      autoRegeneratePickleballFixture();
      notifyAllAdmins({
        title: "Pickleball Registration Approved",
        message: `${reg.player1Name} (${reg.category.replace(/_/g, " ")}) approved${reg.player2Name ? ` with ${reg.player2Name}` : ""}.`,
        link: "/master",
      }).catch(() => {});
      return NextResponse.json({ message: "Approved" });
    }

    if (action === "reject") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "REJECTED" } });
      sendPickleballRejectedEmail(rP1, reg.player1Name, reg.category, rP2, reg.player2Name);
      notifyAllAdmins({
        title: "Pickleball Registration Rejected",
        message: `${reg.player1Name} (${reg.category.replace(/_/g, " ")}) was rejected.`,
        link: "/master",
      }).catch(() => {});
      return NextResponse.json({ message: "Rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Master pickleball POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
