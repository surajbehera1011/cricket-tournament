export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { teamRegistrationSchema } from "@/lib/validators";
import { registerTeam } from "@/lib/business/registration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = teamRegistrationSchema.safeParse({
      ...body,
      submitterEmail: body.captainEmail || body.submitterEmail || "anonymous@public.com",
      submitterName: body.submitterName || body.captainName || "Anonymous",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await registerTeam(parsed.data);

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
