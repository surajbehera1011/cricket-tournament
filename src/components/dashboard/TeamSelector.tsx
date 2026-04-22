"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface Team {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  teamSize: number;
}

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (id: string | null) => void;
  tvMode?: boolean;
}

export function TeamSelector({ teams, selectedTeamId, onSelect, tvMode }: TeamSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-2 rounded-full font-medium transition-all",
          tvMode ? "text-lg px-6 py-3" : "text-sm",
          selectedTeamId === null
            ? "bg-cricket-600 text-white shadow-md"
            : "bg-white text-gray-700 border border-gray-200 hover:border-cricket-300 hover:bg-cricket-50"
        )}
      >
        All Teams
      </button>
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => onSelect(team.id)}
          className={cn(
            "px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2",
            tvMode ? "text-lg px-6 py-3" : "text-sm",
            selectedTeamId === team.id
              ? "bg-cricket-600 text-white shadow-md"
              : "bg-white text-gray-700 border border-gray-200 hover:border-cricket-300 hover:bg-cricket-50"
          )}
        >
          {team.name}
          <Badge
            variant={team.status === "COMPLETE" ? "success" : "warning"}
            className={cn(
              selectedTeamId === team.id && "bg-white/20 text-white"
            )}
          >
            {team.memberCount}/{team.teamSize}
          </Badge>
        </button>
      ))}
    </div>
  );
}
