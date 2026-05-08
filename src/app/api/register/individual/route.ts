export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { individualRegistrationSchema } from "@/lib/validators";
import { registerIndividual } from "@/lib/business/registration";
import { prisma } from "@/lib/prisma";
import { sendIndividualRegistrationConfirmation } from "@/lib/email";
import { notifyAllAdmins } from "@/lib/notifications";
import { hashEmail, decryptEmail } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const settings = await prisma.tournamentSettings.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.cricketRegistrationOpen) {
      return NextResponse.json({ error: "Cricket registrations are currently closed." }, { status: 403 });
    }

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
      where: { emailHash: hashEmail(parsed.data.email) },
      select: { email: true, fullName: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A player with email ${decryptEmail(existing.email)} is already registered (${existing.fullName}).` },
        { status: 400 }
      );
    }

    const result = await registerIndividual(parsed.data);

    sendIndividualRegistrationConfirmation(parsed.data.email, parsed.data.fullName);

    notifyAllAdmins({
      title: "New Individual Registration",
      message: `${parsed.data.fullName} registered as an individual player.`,
      link: "/admin",
    }).catch(() => {});

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
