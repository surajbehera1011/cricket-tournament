export const revalidate = 60;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    let settings = await prisma.tournamentSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.tournamentSettings.create({
        data: { id: "singleton" },
      });
    }

    return jsonResponse(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
