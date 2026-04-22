export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const { id, action } = await request.json();
    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const reg = await prisma.pickleballRegistration.findUnique({ where: { id } });
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.pickleballRegistration.update({
        where: { id },
        data: { status: "APPROVED" },
      });
      return NextResponse.json({ message: "Approved" });
    } else {
      await prisma.pickleballRegistration.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ message: "Rejected" });
    }
  } catch (error) {
    console.error("Pickleball admin action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
