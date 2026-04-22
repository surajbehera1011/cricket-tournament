"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Player {
  id: string;
  fullName: string;
  preferredRole: string;
  membershipType: string;
  positionSlot: string | null;
}

interface Team {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  teamSize: number;
  slotsRemaining: number;
  captain: { displayName: string } | null;
  players: Player[];
}

interface RosterListProps {
  team: Team;
  tvMode?: boolean;
}

export function RosterList({ team, tvMode }: RosterListProps) {
  const nameSize = tvMode ? "text-tv-lg" : "text-base";
  const detailSize = tvMode ? "text-tv-sm" : "text-sm";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className={tvMode ? "text-tv-xl" : ""}>{team.name}</CardTitle>
          {team.captain && (
            <p className={`${detailSize} text-gray-500 mt-1`}>
              Captain: {team.captain.displayName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={team.status === "COMPLETE" ? "success" : "warning"}>
            {team.status}
          </Badge>
          <span className={`${detailSize} text-gray-500`}>
            {team.memberCount}/{team.teamSize} players
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {team.players.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No players yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {team.players.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-cricket-100 text-cricket-700 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className={`${nameSize} font-medium text-gray-900`}>
                      {player.fullName}
                    </p>
                    {player.preferredRole && (
                      <p className={`${detailSize} text-gray-500`}>
                        {player.preferredRole}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={player.membershipType === "TEAM_SUBMISSION" ? "info" : "default"}
                >
                  {player.membershipType === "TEAM_SUBMISSION" ? "Original" : "Draft Pick"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {team.slotsRemaining > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className={`${detailSize} text-amber-600 font-medium`}>
              {team.slotsRemaining} slot{team.slotsRemaining !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
