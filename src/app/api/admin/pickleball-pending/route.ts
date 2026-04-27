export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPickleballApprovedEmail, sendPickleballRejectedEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "all") {
      const all = await prisma.pickleballRegistration.findMany({
        where: { status: { not: "REJECTED" } },
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json(all);
    }

    const pending = await prisma.pickleballRegistration.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(pending);
  } catch (error) {
    console.error("Get pickleball pending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ids, action, player1Name, player2Name } = body;

    if (ids && Array.isArray(ids) && ["approve", "reject"].includes(action)) {
      const regs = await prisma.pickleballRegistration.findMany({ where: { id: { in: ids } } });
      const status = action === "approve" ? "APPROVED" : "REJECTED";
      await prisma.pickleballRegistration.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      for (const r of regs) {
        if (action === "approve") {
          sendPickleballApprovedEmail(r.player1Email, r.player1Name, r.category, r.player2Email, r.player2Name);
        } else {
          sendPickleballRejectedEmail(r.player1Email, r.player1Name, r.category, r.player2Email, r.player2Name);
        }
      }
      return NextResponse.json({ message: `${action}d ${ids.length} registration(s)` });
    }

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const reg = await prisma.pickleballRegistration.findUnique({ where: { id } });
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "APPROVED" } });
      sendPickleballApprovedEmail(reg.player1Email, reg.player1Name, reg.category, reg.player2Email, reg.player2Name);
      return NextResponse.json({ message: "Approved" });
    }

    if (action === "reject") {
      await prisma.pickleballRegistration.update({ where: { id }, data: { status: "REJECTED" } });
      sendPickleballRejectedEmail(reg.player1Email, reg.player1Name, reg.category, reg.player2Email, reg.player2Name);
      return NextResponse.json({ message: "Rejected" });
    }

    if (action === "delete") {
      await prisma.pickleballRegistration.delete({ where: { id } });
      return NextResponse.json({ message: "Deleted" });
    }

    if (action === "edit") {
      const data: Record<string, string> = {};
      if (player1Name?.trim()) data.player1Name = player1Name.trim();
      if (player2Name !== undefined) data.player2Name = player2Name?.trim() || null as any;
      await prisma.pickleballRegistration.update({ where: { id }, data });
      return NextResponse.json({ message: "Updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Pickleball admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
