export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const registrations = await prisma.pickleballRegistration.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    return jsonResponse(registrations);
  } catch (error) {
    console.error("Get pickleball error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
