export const revalidate = 30;

import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";
import { decryptEmail } from "@/lib/crypto";

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

    const decryptReg = (r: typeof registrations[number]) => ({
      ...r,
      player1Email: decryptEmail(r.player1Email) || "",
      player2Email: decryptEmail(r.player2Email),
    });

    return jsonResponse({
      registrations: registrations.map(decryptReg),
      pendingRegistrations: pendingRegistrations.map(decryptReg),
    });
  } catch (error) {
    console.error("Get pickleball error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
