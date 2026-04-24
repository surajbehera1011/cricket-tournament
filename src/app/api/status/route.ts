export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    const [players, teamMemberships, pickleballRegs] = await Promise.all([
      prisma.player.findMany({
        where: { email: { equals: email, mode: "insensitive" } },
        select: {
          id: true,
          fullName: true,
          poolStatus: true,
          preferredRole: true,
          createdAt: true,
          memberships: {
            select: {
              team: {
                select: { id: true, name: true, status: true },
              },
            },
          },
        },
      }),
      prisma.teamMembership.findMany({
        where: {
          player: { email: { equals: email, mode: "insensitive" } },
        },
        select: {
          team: {
            select: { id: true, name: true, status: true, captainName: true },
          },
          player: {
            select: { fullName: true },
          },
        },
      }),
      prisma.pickleballRegistration.findMany({
        where: {
          OR: [
            { player1Email: { equals: email, mode: "insensitive" } },
            { player2Email: { equals: email, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          category: true,
          player1Name: true,
          player1Email: true,
          player2Name: true,
          player2Email: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const results: {
      sport: string;
      type: string;
      name: string;
      status: string;
      statusLabel: string;
      detail: string;
      createdAt: Date;
    }[] = [];

    for (const player of players) {
      if (player.memberships.length > 0) {
        for (const m of player.memberships) {
          results.push({
            sport: "Cricket",
            type: "Team",
            name: `${m.team.name} (${player.fullName})`,
            status: m.team.status,
            statusLabel: getTeamStatusLabel(m.team.status),
            detail: `Team member of ${m.team.name}`,
            createdAt: player.createdAt,
          });
        }
      } else if (player.poolStatus !== "NONE" && player.poolStatus !== "ASSIGNED") {
        results.push({
          sport: "Cricket",
          type: "Individual",
          name: player.fullName,
          status: player.poolStatus,
          statusLabel: getPoolStatusLabel(player.poolStatus),
          detail: player.preferredRole ? `Role: ${player.preferredRole}` : "Individual registration",
          createdAt: player.createdAt,
        });
      }
    }

    for (const reg of pickleballRegs) {
      const categoryLabel = getCategoryLabel(reg.category);
      const isDoubles = reg.category.includes("DOUBLES");
      results.push({
        sport: "Pickleball",
        type: categoryLabel,
        name: isDoubles && reg.player2Name
          ? `${reg.player1Name} & ${reg.player2Name}`
          : reg.player1Name,
        status: reg.status,
        statusLabel: getPickleballStatusLabel(reg.status),
        detail: categoryLabel,
        createdAt: reg.createdAt,
      });
    }

    return jsonResponse({ results });
  } catch (error) {
    console.error("Status lookup error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

function getTeamStatusLabel(status: string): string {
  switch (status) {
    case "PENDING_APPROVAL": return "Pending Approval";
    case "INCOMPLETE": return "Approved - In Progress";
    case "COMPLETE": return "Submitted";
    case "READY": return "Ready";
    default: return status;
  }
}

function getPoolStatusLabel(status: string): string {
  switch (status) {
    case "PENDING_APPROVAL": return "Pending Approval";
    case "LOOKING_FOR_TEAM": return "Approved - In Player Pool";
    case "ASSIGNED": return "Assigned to Team";
    default: return status;
  }
}

function getPickleballStatusLabel(status: string): string {
  switch (status) {
    case "PENDING_APPROVAL": return "Pending Approval";
    case "APPROVED": return "Approved";
    case "REJECTED": return "Rejected";
    default: return status;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "MENS_SINGLES": return "Men's Singles";
    case "WOMENS_SINGLES": return "Women's Singles";
    case "MENS_DOUBLES": return "Men's Doubles";
    case "WOMENS_DOUBLES": return "Women's Doubles";
    case "MIXED_DOUBLES": return "Mixed Doubles";
    default: return category;
  }
}
