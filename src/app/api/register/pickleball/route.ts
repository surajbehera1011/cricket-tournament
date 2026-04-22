export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SINGLES = ["MENS_SINGLES", "WOMENS_SINGLES"];

const schema = z.object({
  category: z.enum(["MENS_SINGLES", "WOMENS_SINGLES", "MENS_DOUBLES", "WOMENS_DOUBLES", "MIXED_DOUBLES"]),
  player1Name: z.string().min(1, "Player 1 name is required"),
  player1Email: z.string().email("Valid email required for Player 1"),
  player2Name: z.string().optional(),
  player2Email: z.string().optional(),
}).refine(
  (data) => {
    if (!SINGLES.includes(data.category)) {
      return !!data.player2Name?.trim() && !!data.player2Email?.trim();
    }
    return true;
  },
  { message: "Partner name and email are required for doubles categories" }
).refine(
  (data) => {
    if (!SINGLES.includes(data.category) && data.player1Email && data.player2Email) {
      return data.player1Email.toLowerCase() !== data.player2Email.toLowerCase();
    }
    return true;
  },
  { message: "Both players cannot have the same email" }
);

export async function POST(request: NextRequest) {
  try {
    const settings = await prisma.tournamentSettings.findUnique({ where: { id: "singleton" } });
    if (settings && !settings.registrationOpen) {
      return NextResponse.json({ error: "Registrations are currently closed." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const msg = flat.formErrors[0] || Object.values(flat.fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { category, player1Email, player2Email } = parsed.data;
    const isSingles = SINGLES.includes(category);

    const emailsToCheck = [player1Email.toLowerCase()];
    if (!isSingles && player2Email) emailsToCheck.push(player2Email.toLowerCase());

    for (const email of emailsToCheck) {
      const existing = await prisma.pickleballRegistration.findFirst({
        where: {
          category,
          status: { not: "REJECTED" },
          OR: [
            { player1Email: { equals: email, mode: "insensitive" } },
            { player2Email: { equals: email, mode: "insensitive" } },
          ],
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `${email} is already registered in this category.` },
          { status: 400 }
        );
      }
    }

    const registration = await prisma.pickleballRegistration.create({
      data: {
        category: parsed.data.category,
        player1Name: parsed.data.player1Name.trim(),
        player1Email: parsed.data.player1Email.trim().toLowerCase(),
        player2Name: isSingles ? null : parsed.data.player2Name?.trim() || null,
        player2Email: isSingles ? null : parsed.data.player2Email?.trim().toLowerCase() || null,
      },
    });

    return NextResponse.json(
      { message: "Pickleball registration submitted! Awaiting admin approval.", id: registration.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pickleball registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
