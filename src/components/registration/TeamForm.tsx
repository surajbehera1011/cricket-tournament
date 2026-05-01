"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useFormAutosave } from "@/lib/useFormAutosave";

interface PlayerEntry {
  name: string;
  gender: string;
  email: string;
}

interface TeamFormProps {
  onSuccess: (email: string) => void;
}

interface TeamFormData {
  teamName: string;
  teamColor: string;
  captainName: string;
  captainGender: string;
  captainEmail: string;
  comments: string;
  players: PlayerEntry[];
  extraPlayers: PlayerEntry[];
}

const MIN_PLAYERS_TO_REGISTER = 4;
const MANDATORY_PLAYER_COUNT = 8;
const MAX_EXTRA_PLAYERS = 2;

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

const INITIAL_TEAM: TeamFormData = {
  teamName: "", teamColor: "", captainName: "", captainGender: "", captainEmail: "", comments: "",
  players: [{ name: "", gender: "", email: "" }, { name: "", gender: "", email: "" }, { name: "", gender: "", email: "" }],
  extraPlayers: [],
};

export function TeamForm({ onSuccess }: TeamFormProps) {
  const { value: saved, setValue: setSaved, restored, clear: clearSaved, dismiss } = useFormAutosave<TeamFormData>("team", INITIAL_TEAM);
  const teamName = saved.teamName;
  const teamColor = saved.teamColor;
  const captainName = saved.captainName;
  const captainGender = saved.captainGender;
  const captainEmail = saved.captainEmail;
  const comments = saved.comments;
  const players = saved.players;
  const extraPlayers = saved.extraPlayers;
  const setField = (field: keyof TeamFormData, val: string | PlayerEntry[]) => setSaved((p) => ({ ...p, [field]: val }));
  const setTeamName = (v: string) => setField("teamName", v);
  const setTeamColor = (v: string) => setField("teamColor", v);
  const setCaptainName = (v: string) => setField("captainName", v);
  const setCaptainGender = (v: string) => setField("captainGender", v);
  const setCaptainEmail = (v: string) => setField("captainEmail", v);
  const setComments = (v: string) => setField("comments", v);
  const setPlayers = (fn: PlayerEntry[] | ((prev: PlayerEntry[]) => PlayerEntry[])) =>
    setSaved((p) => ({ ...p, players: typeof fn === "function" ? fn(p.players) : fn }));
  const setExtraPlayers = (fn: PlayerEntry[] | ((prev: PlayerEntry[]) => PlayerEntry[])) =>
    setSaved((p) => ({ ...p, extraPlayers: typeof fn === "function" ? fn(p.extraPlayers) : fn }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [shakeKey, setShakeKey] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);

  const DOMAIN = "@aligntech.com";

  const showError = useCallback((msg: string, fields: string[] = []) => {
    setError(msg);
    setErrorFields(new Set(fields));
    setShakeKey((k) => k + 1);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  const isFieldError = (field: string) => errorFields.has(field);

  const clearError = () => {
    if (error) {
      setError("");
      setErrorFields(new Set());
    }
  };

  const maxAdditionalMandatory = MANDATORY_PLAYER_COUNT - 1;
  const minAdditionalMandatory = MIN_PLAYERS_TO_REGISTER - 1;

  const updatePlayer = (idx: number, field: keyof PlayerEntry, value: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const updateExtraPlayer = (idx: number, field: keyof PlayerEntry, value: string) => {
    setExtraPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addPlayer = () => {
    if (players.length < maxAdditionalMandatory) {
      setPlayers((prev) => [...prev, { name: "", gender: "", email: "" }]);
    }
  };

  const removePlayer = (idx: number) => {
    if (players.length > minAdditionalMandatory) {
      setPlayers((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const addExtraPlayer = () => {
    if (extraPlayers.length >= MAX_EXTRA_PLAYERS) return;
    setExtraPlayers((prev) => [...prev, { name: "", gender: "", email: "" }]);
  };

  const removeExtraPlayer = (idx: number) => {
    setExtraPlayers((prev) => prev.filter((_, i) => i !== idx));
  };

  const getAvailableExtraGenders = (currentIdx: number): string[] => {
    const otherMaleCount = extraPlayers
      .filter((_, i) => i !== currentIdx)
      .filter((p) => p.gender === "MALE").length;
    const available: string[] = [];
    if (otherMaleCount < 1) available.push("MALE");
    available.push("FEMALE");
    return available;
  };

  const getAllPlayers = () => {
    const validMandatory = players.filter((p) => p.name.trim() !== "");
    const validExtra = extraPlayers.filter((p) => p.name.trim() !== "");
    return { validMandatory, validExtra };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorFields(new Set());

    if (!captainGender) {
      showError("Please select gender for the captain", ["captain-gender"]);
      return;
    }
    if (!captainEmail.trim()) {
      showError("Captain email is required", ["captain-email"]);
      return;
    }

    if (!captainEmail.toLowerCase().endsWith(DOMAIN)) {
      showError(`Captain email must be an ${DOMAIN} address`, ["captain-email"]);
      return;
    }

    const { validMandatory, validExtra } = getAllPlayers();
    const totalMandatory = 1 + validMandatory.length;

    if (totalMandatory < MIN_PLAYERS_TO_REGISTER) {
      showError(`Minimum ${MIN_PLAYERS_TO_REGISTER} players required to register (including captain). You have ${totalMandatory}.`, ["players"]);
      return;
    }

    const mandatoryFemaleCount = [captainGender, ...validMandatory.map((p) => p.gender)].filter((g) => g === "FEMALE").length;
    if (mandatoryFemaleCount < 1) {
      showError("At least 1 female player is required among the mandatory players (including captain).", ["players"]);
      return;
    }

    for (let i = 0; i < validMandatory.length; i++) {
      if (!validMandatory[i].gender) {
        showError(`Please select gender for ${validMandatory[i].name || `Mandatory Player ${i + 2}`}`, [`player-${i}-gender`]);
        return;
      }
      if (!validMandatory[i].email.trim()) {
        showError(`Please enter email for ${validMandatory[i].name || `Mandatory Player ${i + 2}`}`, [`player-${i}-email`]);
        return;
      }
    }

    for (let i = 0; i < validExtra.length; i++) {
      if (!validExtra[i].gender) {
        showError(`Please select gender for extra player: ${validExtra[i].name || `Extra Player ${i + 1}`}`, [`extra-${i}-gender`]);
        return;
      }
      if (validExtra[i].gender !== "MALE" && validExtra[i].gender !== "FEMALE") {
        showError(`Extra players must be Male or Female only`, [`extra-${i}-gender`]);
        return;
      }
      if (!validExtra[i].email.trim()) {
        showError(`Please enter email for extra player: ${validExtra[i].name || `Extra Player ${i + 1}`}`, [`extra-${i}-email`]);
        return;
      }
    }

    if (validExtra.length > 0) {
      const extraMales = validExtra.filter((p) => p.gender === "MALE").length;
      if (extraMales > 1) {
        showError("Extra players: only 1 male allowed (2 females is OK, but not 2 males)", validExtra.map((_, i) => `extra-${i}-gender`));
        return;
      }
    }

    const allEmails = [
      captainEmail.trim().toLowerCase(),
      ...validMandatory.map((p) => p.email.trim().toLowerCase()),
      ...validExtra.map((p) => p.email.trim().toLowerCase()),
    ];
    const badFields: string[] = [];
    for (let idx = 0; idx < allEmails.length; idx++) {
      if (!allEmails[idx].endsWith(DOMAIN)) {
        if (idx === 0) badFields.push("captain-email");
        else if (idx <= validMandatory.length) badFields.push(`player-${idx - 1}-email`);
        else badFields.push(`extra-${idx - 1 - validMandatory.length}-email`);
      }
    }
    if (badFields.length > 0) {
      showError(`All emails must be ${DOMAIN} addresses`, badFields);
      return;
    }
    const seen = new Set<string>();
    for (let idx = 0; idx < allEmails.length; idx++) {
      const email = allEmails[idx];
      if (seen.has(email)) {
        const dupFields: string[] = [];
        if (idx === 0) dupFields.push("captain-email");
        else if (idx <= validMandatory.length) dupFields.push(`player-${idx - 1}-email`);
        else dupFields.push(`extra-${idx - 1 - validMandatory.length}-email`);
        showError(`Duplicate email found: ${email}. Each player must have a unique email.`, dupFields);
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
          players: validMandatory,
          extraPlayers: validExtra,
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
      setExtraPlayers([]);
      clearSaved();
      onSuccess(captainEmail);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalMandatoryCount = 1 + players.length;
  const totalCount = totalMandatoryCount + extraPlayers.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onChange={clearError}>
      {restored && (
        <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>Draft restored from your previous session.</span>
          <button type="button" onClick={() => { clearSaved(); setSaved(INITIAL_TEAM); dismiss(); }} className="text-xs font-bold text-brand-400 hover:text-brand-300">Clear Draft</button>
        </div>
      )}
      {error && (
        <div
          key={shakeKey}
          ref={errorRef}
          className="animate-shake bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-xl text-sm space-y-1">
        <p>
          <strong>Mandatory:</strong> {MANDATORY_PLAYER_COUNT} players (at least 1 female required).
          Minimum <strong>{MIN_PLAYERS_TO_REGISTER}</strong> to start registration.
        </p>
        <p>
          <strong>Extra (optional):</strong> Captain can add up to {MAX_EXTRA_PLAYERS} extra players.
          Max 1 male allowed; 2 females OK. No 2 males.
        </p>
        <p>
          <strong>Total max team size:</strong> {MANDATORY_PLAYER_COUNT + MAX_EXTRA_PLAYERS} players.
          Gender is mandatory for all players.
        </p>
        <p>
          <strong>Email:</strong> All player emails must be <strong>@aligntech.com</strong> addresses.
        </p>
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
        <h3 className="text-sm font-semibold text-amber-400">Captain (Player 1 — Mandatory)</h3>
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
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError("captain-email") ? "field-error" : "border-white/10"}`}
              placeholder="captain@aligntech.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Gender *</label>
            <select
              value={captainGender}
              onChange={(e) => setCaptainGender(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${
                isFieldError("captain-gender")
                  ? "field-error"
                  : captainGender === "FEMALE"
                  ? "border-pink-500/30"
                  : "border-white/10"
              }`}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mandatory Players Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">
            Mandatory Players ({players.length} + 1 captain = {totalMandatoryCount}/{MANDATORY_PLAYER_COUNT})
          </h3>
          {players.length < maxAdditionalMandatory && (
            <button
              type="button"
              onClick={addPlayer}
              className="text-sm text-brand-400 hover:text-brand-300 font-medium"
            >
              + Add Mandatory Player
            </button>
          )}
        </div>

        {totalMandatoryCount < MANDATORY_PLAYER_COUNT && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg text-xs mb-3">
            You need {MANDATORY_PLAYER_COUNT - totalMandatoryCount} more mandatory player(s) to complete the team.
            At least 1 female player is required among the {MANDATORY_PLAYER_COUNT} mandatory players.
          </div>
        )}

        {(() => {
          const femaleCount = [captainGender, ...players.map((p) => p.gender)].filter((g) => g === "FEMALE").length;
          if (femaleCount < 1) {
            return (
              <div className="bg-pink-500/10 border border-pink-500/20 text-pink-400 px-3 py-2 rounded-lg text-xs mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>No female player added yet. At least <strong>1 female</strong> is required in mandatory players.</span>
              </div>
            );
          }
          return null;
        })()}

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
                  className={`px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError(`player-${idx}-email`) ? "field-error" : "border-white/10"}`}
                  placeholder="name@aligntech.com"
                />
                <select
                  value={player.gender}
                  onChange={(e) => updatePlayer(idx, "gender", e.target.value)}
                  className={`px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${
                    isFieldError(`player-${idx}-gender`)
                      ? "field-error"
                      : player.gender === "FEMALE"
                      ? "border-pink-500/30"
                      : "border-white/10"
                  }`}
                >
                  <option value="">Gender *</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              {players.length > minAdditionalMandatory && (
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

        {players.length < maxAdditionalMandatory && (
          <p className="text-xs text-slate-400 mt-2">
            You can add up to {MANDATORY_PLAYER_COUNT} mandatory players total (including captain).
          </p>
        )}
      </div>

      {/* Extra Players Section */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-400">
            Extra Players ({extraPlayers.length}/{MAX_EXTRA_PLAYERS}) — Optional
          </h3>
          {extraPlayers.length < MAX_EXTRA_PLAYERS && (
            <button
              type="button"
              onClick={addExtraPlayer}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
            >
              + Add Extra Player
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Captain can optionally add up to 2 extra players. Max 1 male allowed; 2 females is OK.
          Not compulsory — you can skip this section entirely.
        </p>

        {extraPlayers.length > 0 && (
          <div className="space-y-3">
            {extraPlayers.map((player, idx) => {
              const availableGenders = getAvailableExtraGenders(idx);
              return (
                <div key={idx} className="flex items-start gap-2 bg-dark-500/60 rounded-xl p-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    E{idx + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updateExtraPlayer(idx, "name", e.target.value)}
                      className="px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100"
                      placeholder={`Extra player ${idx + 1} name *`}
                    />
                    <input
                      type="email"
                      value={player.email}
                      onChange={(e) => updateExtraPlayer(idx, "email", e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError(`extra-${idx}-email`) ? "field-error" : "border-white/10"}`}
                      placeholder="name@aligntech.com"
                    />
                    <select
                      value={player.gender}
                      onChange={(e) => updateExtraPlayer(idx, "gender", e.target.value)}
                      className={`px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100 ${
                        isFieldError(`extra-${idx}-gender`)
                          ? "field-error"
                          : player.gender === "FEMALE"
                          ? "border-pink-500/30"
                          : "border-white/10"
                      }`}
                    >
                      <option value="">Gender *</option>
                      {availableGenders.includes("MALE") && <option value="MALE">Male</option>}
                      {availableGenders.includes("FEMALE") && <option value="FEMALE">Female</option>}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraPlayer(idx)}
                    className="text-red-400 hover:text-red-600 text-lg flex-shrink-0 mt-1"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-slate-500/10 border border-slate-500/20 text-slate-300 px-4 py-3 rounded-xl text-sm">
        <strong>Summary:</strong> {totalMandatoryCount} mandatory + {extraPlayers.length} extra = {totalCount} total player(s)
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

      <Button type="submit" loading={loading} size="lg" className={`w-full ${error ? "btn-error-pulse" : ""}`}>
        Register Team
      </Button>
    </form>
  );
}
