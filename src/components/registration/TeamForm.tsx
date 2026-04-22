"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface PlayerEntry {
  name: string;
  gender: string;
}

interface TeamFormProps {
  onSuccess: () => void;
}

export function TeamForm({ onSuccess }: TeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [comments, setComments] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState(9);
  const [minFemale, setMinFemale] = useState(1);
  const [players, setPlayers] = useState<PlayerEntry[]>([{ name: "", gender: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((s) => {
        if (s.maxTeamSize) setMaxTeamSize(s.maxTeamSize);
        if (s.minFemalePerTeam !== undefined) setMinFemale(s.minFemalePerTeam);
      })
      .catch(() => {});
  }, []);

  const updatePlayer = (idx: number, field: "name" | "gender", value: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addPlayer = () => {
    if (players.length < maxTeamSize) {
      setPlayers((prev) => [...prev, { name: "", gender: "" }]);
    }
  };

  const removePlayer = (idx: number) => {
    if (players.length > 1) {
      setPlayers((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validPlayers = players.filter((p) => p.name.trim() !== "");
    if (validPlayers.length === 0) {
      setError("At least 1 player is required");
      return;
    }

    for (let i = 0; i < validPlayers.length; i++) {
      if (!validPlayers[i].gender) {
        setError(`Please select gender for ${validPlayers[i].name || `Player ${i + 1}`}`);
        return;
      }
    }

    const femaleCount = validPlayers.filter((p) => p.gender === "FEMALE").length;
    if (femaleCount < minFemale) {
      setError(`Team must have at least ${minFemale} female player(s). Currently: ${femaleCount}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          captainName,
          players: validPlayers,
          comments,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      setTeamName("");
      setCaptainName("");
      setComments("");
      setPlayers([{ name: "", gender: "" }]);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
        Team size is set to <strong>{maxTeamSize}</strong> players. Minimum <strong>{minFemale}</strong> female player(s) required.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
          <input
            type="text"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="e.g. Royal Strikers"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Captain Name *</label>
          <input
            type="text"
            required
            value={captainName}
            onChange={(e) => setCaptainName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="e.g. Rahul Sharma"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            Players ({players.length}/{maxTeamSize})
          </h3>
          {players.length < maxTeamSize && (
            <button
              type="button"
              onClick={addPlayer}
              className="text-sm text-cricket-600 hover:text-cricket-700 font-medium"
            >
              + Add Player
            </button>
          )}
        </div>

        <div className="space-y-3">
          {players.map((player, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                value={player.name}
                onChange={(e) => updatePlayer(idx, "name", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
                placeholder={`Player ${idx + 1} name ${idx === 0 ? "*" : ""}`}
                required={idx === 0}
              />
              <select
                value={player.gender}
                onChange={(e) => updatePlayer(idx, "gender", e.target.value)}
                className={`w-28 px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-cricket-500 focus:border-transparent ${
                  player.gender === "FEMALE"
                    ? "border-pink-300 bg-pink-50"
                    : "border-gray-300"
                }`}
              >
                <option value="">Gender *</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {players.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(idx)}
                  className="text-red-400 hover:text-red-600 text-lg flex-shrink-0"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {players.length < maxTeamSize && (
          <p className="text-xs text-gray-400 mt-2">
            You can add up to {maxTeamSize} players. Remaining slots can be filled via draft later.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Register Team
      </Button>
    </form>
  );
}
