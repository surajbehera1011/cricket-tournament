export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignPlayerSchema } from "@/lib/validators";
import { assignPlayerToTeam, AuthorizationError, BusinessError } from "@/lib/business/assignment";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = assignPlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const membership = await assignPlayerToTeam(
      params.id,
      parsed.data.playerId,
      session.user.id,
      session.user.role
    );

    return NextResponse.json(
      { message: "Player assigned successfully", membership },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Assign player error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
