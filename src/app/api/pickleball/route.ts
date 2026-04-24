export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const [registrations, pendingRegistrations] = await Promise.all([
      prisma.pickleballRegistration.findMany({
        where: { status: "APPROVED" },
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
      }),
      prisma.pickleballRegistration.findMany({
        where: { status: "PENDING_APPROVAL" },
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    return jsonResponse({ registrations, pendingRegistrations });
  } catch (error) {
    console.error("Get pickleball error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
