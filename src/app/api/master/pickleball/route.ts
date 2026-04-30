export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPickleballApprovedEmail, sendPickleballRejectedEmail } from "@/lib/email";
import { autoRegeneratePickleballFixture } from "@/lib/fixture-auto-regen";

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

    return NextResponse.json({ registration, totalPending });
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

    if (action === "approve") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "APPROVED" } });
      sendPickleballApprovedEmail(reg.player1Email, reg.player1Name, reg.category, reg.player2Email, reg.player2Name);
      autoRegeneratePickleballFixture();
      return NextResponse.json({ message: "Approved" });
    }

    if (action === "reject") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "REJECTED" } });
      sendPickleballRejectedEmail(reg.player1Email, reg.player1Name, reg.category, reg.player2Email, reg.player2Name);
      return NextResponse.json({ message: "Rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Master pickleball POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
