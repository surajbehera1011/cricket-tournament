"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface PlayerEntry {
  name: string;
  gender: string;
  email: string;
}

interface TeamFormProps {
  onSuccess: (email: string) => void;
}

const MIN_TOTAL_PLAYERS = 4;

const TEAM_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#6b7280", label: "Gray" },
];

export function TeamForm({ onSuccess }: TeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainGender, setCaptainGender] = useState("");
  const [captainEmail, setCaptainEmail] = useState("");
  const [comments, setComments] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState(9);
  const [minFemale, setMinFemale] = useState(1);
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { name: "", gender: "", email: "" },
    { name: "", gender: "", email: "" },
    { name: "", gender: "", email: "" },
  ]);
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

  const maxAdditionalPlayers = maxTeamSize - 1;

  const updatePlayer = (idx: number, field: keyof PlayerEntry, value: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addPlayer = () => {
    if (players.length < maxAdditionalPlayers) {
      setPlayers((prev) => [{ name: "", gender: "", email: "" }, ...prev]);
    }
  };

  const removePlayer = (idx: number) => {
    const minAdditional = MIN_TOTAL_PLAYERS - 1;
    if (players.length > minAdditional) {
      setPlayers((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captainGender) {
      setError("Please select gender for the captain");
      return;
    }
    if (!captainEmail.trim()) {
      setError("Captain email is required");
      return;
    }

    const validPlayers = players.filter((p) => p.name.trim() !== "");
    const totalPlayers = 1 + validPlayers.length;

    if (totalPlayers < MIN_TOTAL_PLAYERS) {
      setError(`Minimum ${MIN_TOTAL_PLAYERS} players required (including captain). You have ${totalPlayers}.`);
      return;
    }

    for (let i = 0; i < validPlayers.length; i++) {
      if (!validPlayers[i].gender) {
        setError(`Please select gender for ${validPlayers[i].name || `Player ${i + 1}`}`);
        return;
      }
      if (!validPlayers[i].email.trim()) {
        setError(`Please enter email for ${validPlayers[i].name || `Player ${i + 1}`}`);
        return;
      }
    }

    // Check for duplicate emails
    const allEmails = [captainEmail.trim().toLowerCase(), ...validPlayers.map((p) => p.email.trim().toLowerCase())];
    const seen = new Set<string>();
    for (const email of allEmails) {
      if (seen.has(email)) {
        setError(`Duplicate email found: ${email}. Each player must have a unique email.`);
        return;
      }
      seen.add(email);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          teamColor,
          captainName,
          captainGender,
          captainEmail,
          players: validPlayers,
          comments,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      setTeamName("");
      setTeamColor("");
      setCaptainName("");
      setCaptainGender("");
      setCaptainEmail("");
      setComments("");
      setPlayers([
        { name: "", gender: "", email: "" },
        { name: "", gender: "", email: "" },
        { name: "", gender: "", email: "" },
      ]);
      onSuccess(captainEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalPlayerCount = 1 + players.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm">
        Team size: <strong>{maxTeamSize}</strong> players. Minimum <strong>{MIN_TOTAL_PLAYERS}</strong> to register (including captain).
        Minimum <strong>{minFemale}</strong> female player(s) required for team completion.
      </div>

      {/* Team Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Team Name *</label>
        <input
          type="text"
          required
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
          placeholder="e.g. Royal Strikers"
        />
      </div>

      {/* Team Color */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Team Color (optional)</label>
        <div className="flex flex-wrap gap-2">
          {TEAM_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setTeamColor(teamColor === c.value ? "" : c.value)}
              className={`w-9 h-9 rounded-xl border-2 transition-all ${teamColor === c.value ? "border-white scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
              style={{ background: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Captain Section */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-amber-400">Captain (Player 1)</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
              placeholder="Captain full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
            <input
              type="email"
              required
              value={captainEmail}
              onChange={(e) => setCaptainEmail(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
              placeholder="captain@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Gender *</label>
            <select
              value={captainGender}
              onChange={(e) => setCaptainGender(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${
                captainGender === "FEMALE"
                  ? "border-pink-500/30"
                  : "border-white/10"
              }`}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Players */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">
            Additional Players ({players.length} + 1 captain = {totalPlayerCount}/{maxTeamSize})
          </h3>
          {players.length < maxAdditionalPlayers && (
            <button
              type="button"
              onClick={addPlayer}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium"
            >
              + Add Player
            </button>
          )}
        </div>

        <div className="space-y-3">
          {players.map((player, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-dark-500/60 rounded-xl p-2">
              <span className="w-6 h-6 rounded-full bg-dark-400 text-slate-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                {idx + 2}
              </span>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(idx, "name", e.target.value)}
                  className="px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
                  placeholder={`Player ${idx + 2} name *`}
                />
                <input
                  type="email"
                  value={player.email}
                  onChange={(e) => updatePlayer(idx, "email", e.target.value)}
                  className="px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
                  placeholder="Email *"
                />
                <select
                  value={player.gender}
                  onChange={(e) => updatePlayer(idx, "gender", e.target.value)}
                  className={`px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${
                    player.gender === "FEMALE"
                      ? "border-pink-500/30"
                      : "border-white/10"
                  }`}
                >
                  <option value="">Gender *</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {players.length > MIN_TOTAL_PLAYERS - 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(idx)}
                  className="text-red-400 hover:text-red-600 text-lg flex-shrink-0 mt-1"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {players.length < maxAdditionalPlayers && (
          <p className="text-xs text-slate-400 mt-2">
            You can add up to {maxTeamSize} players total (including captain). Remaining slots can be filled via draft later.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
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
