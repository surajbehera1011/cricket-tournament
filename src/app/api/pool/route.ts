export const revalidate = 60;

import { prisma } from "@/lib/prisma";
import { PoolStatus } from "@prisma/client";
import { jsonResponse } from "@/lib/api-utils";
import { decryptEmail } from "@/lib/crypto";

export async function GET() {
  try {
    const [players, pendingPlayers] = await Promise.all([
      prisma.player.findMany({
        where: { poolStatus: PoolStatus.LOOKING_FOR_TEAM },
        orderBy: { createdAt: "desc" },
      }),
      prisma.player.findMany({
        where: { poolStatus: PoolStatus.PENDING_APPROVAL },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const decryptPlayer = (p: typeof players[number]) => ({
      ...p,
      email: decryptEmail(p.email),
    });

    return jsonResponse({
      players: players.map(decryptPlayer),
      pendingPlayers: pendingPlayers.map(decryptPlayer),
    });
  } catch (error) {
    console.error("Get pool error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
