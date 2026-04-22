export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { teamRegistrationSchema } from "@/lib/validators";
import { registerTeam } from "@/lib/business/registration";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = teamRegistrationSchema.safeParse({
      ...body,
      submitterEmail: body.captainEmail || body.submitterEmail || "anonymous@public.com",
      submitterName: body.submitterName || body.captainName || "Anonymous",
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const msg = flat.formErrors.length > 0
        ? flat.formErrors[0]
        : "Validation failed";
      return NextResponse.json({ error: msg, details: flat }, { status: 400 });
    }

    const allEmails = [
      parsed.data.captainEmail,
      ...parsed.data.players.map((p) => p.email),
    ].map((e) => e.toLowerCase());

    const existing = await prisma.player.findMany({
      where: { email: { in: allEmails, mode: "insensitive" } },
      select: { email: true, fullName: true },
    });

    if (existing.length > 0) {
      const dupes = existing.map((p) => `${p.fullName} (${p.email})`).join(", ");
      return NextResponse.json(
        { error: `These players are already registered: ${dupes}` },
        { status: 400 }
      );
    }

    const result = await registerTeam(parsed.data, body.teamColor || "");

    return NextResponse.json(
      {
        message: "Team registration submitted! It will appear after admin approval.",
        team: { id: result.team.id, name: result.team.name },
        playerCount: result.players.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
