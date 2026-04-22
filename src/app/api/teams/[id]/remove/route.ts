import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removePlayerSchema } from "@/lib/validators";
import { removePlayerFromTeam, AuthorizationError, BusinessError } from "@/lib/business/assignment";

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
    const parsed = removePlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await removePlayerFromTeam(
      params.id,
      parsed.data.playerId,
      session.user.id,
      session.user.role
    );

    return NextResponse.json({ message: "Player removed successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Remove player error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
