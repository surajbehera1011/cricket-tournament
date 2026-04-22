export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { individualRegistrationSchema } from "@/lib/validators";
import { registerIndividual } from "@/lib/business/registration";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = individualRegistrationSchema.safeParse({
      ...body,
      submitterEmail: body.email || "anonymous@public.com",
      submitterName: body.fullName,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const msg = Object.values(flat.fieldErrors).flat()[0] || flat.formErrors[0] || "Validation failed";
      return NextResponse.json({ error: msg, details: flat }, { status: 400 });
    }

    const existing = await prisma.player.findFirst({
      where: { email: { equals: parsed.data.email, mode: "insensitive" } },
      select: { email: true, fullName: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A player with email ${existing.email} is already registered (${existing.fullName}).` },
        { status: 400 }
      );
    }

    const result = await registerIndividual(parsed.data);

    return NextResponse.json(
      {
        message: "Registration submitted! You will appear in the pool after admin approval.",
        player: { id: result.player.id, fullName: result.player.fullName },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Individual registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
