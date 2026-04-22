export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { individualRegistrationSchema } from "@/lib/validators";
import { registerIndividual } from "@/lib/business/registration";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = individualRegistrationSchema.safeParse({
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

    const result = await registerIndividual(parsed.data, session.user.id);

    return NextResponse.json(
      {
        message: "Individual registered successfully",
        player: { id: result.player.id, fullName: result.player.fullName },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Individual registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
