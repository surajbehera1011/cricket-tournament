export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { teamRegistrationSchema } from "@/lib/validators";
import { registerTeam } from "@/lib/business/registration";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = teamRegistrationSchema.safeParse({
      ...body,
      submitterEmail: session.user.email,
      submitterName: session.user.name,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await registerTeam(parsed.data, session.user.id);

    return NextResponse.json(
      {
        message: "Team registered successfully",
        team: { id: result.team.id, name: result.team.name, status: result.team.status },
        playerCount: result.players.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
