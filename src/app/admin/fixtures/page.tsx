"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

// ─── Types ──────────────────────────────────────
interface MatchData {
  id: string;
  sport: string;
  stage: string;
  groupName: string | null;
  roundNumber: number;
  matchNumber: number;
  category: string | null;
  team1Id: string | null;
  team2Id: string | null;
  entry1Id: string | null;
  entry2Id: string | null;
  score1: string | null;
  score2: string | null;
  winnerId: string | null;
  scheduledDate: string | null;
  venue: string | null;
  status: string;
  notificationSent: boolean;
}

interface FixtureData {
  id: string;
  sport: string;
  status: string;
  groupCount: number;
  frozenCategories?: string[];
  matches: MatchData[];
}

interface TeamInfo {
  id: string;
  name: string;
  color: string;
  captainName: string;
}

interface PbRegInfo {
  id: string;
  player1Name: string;
  player2Name: string | null;
  category: string;
}

type Sport = "CRICKET" | "PICKLEBALL";

const PB_CAT_LABELS: Record<string, string> = {
  MENS_SINGLES: "Men's Singles",
  WOMENS_SINGLES: "Women's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

const PB_CATS = Object.keys(PB_CAT_LABELS);

// ─── Draggable Slot ─────────────────────────────
function DraggableSlot({
  id,
  label,
  color,
  isTBD,
}: {
  id: string;
  label: string;
  color?: string;
  isTBD: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`h-[22px] flex items-center gap-1.5 px-2 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${isTBD ? "text-slate-600" : "bg-white/[0.02] text-slate-200"}`}
    >
      <div
        className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
        style={{ background: isTBD ? "rgba(55,65,81,0.5)" : (color || "#6366f1") }}
      >
        {isTBD ? "?" : label.charAt(0).toUpperCase()}
      </div>
      <span className={`text-[11px] font-semibold truncate flex-1 ${isTBD ? "italic" : ""}`}>
        {isTBD ? "TBD" : label}
      </span>
      <span className="text-[9px] font-mono text-slate-600 w-3 text-center">-</span>
    </div>
  );
}

// ─── Droppable Match Card ───────────────────────
function DroppableMatchCard({
  match,
  slot,
  children,
}: {
  match: MatchData;
  slot: "1" | "2";
  children: React.ReactNode;
}) {
  const dropId = `${match.id}__${slot}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-0 transition-all rounded-lg ${
        isOver ? "ring-2 ring-brand-400 bg-brand-500/10" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────
export default function AdminFixturesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [sport, setSport] = useState<Sport>("PICKLEBALL");
  const [fixture, setFixture] = useState<FixtureData | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [pbRegs, setPbRegs] = useState<PbRegInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [groupCount, setGroupCount] = useState(4);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [bulkDate, setBulkDate] = useState("");
  const [bulkVenue, setBulkVenue] = useState("");

  const fetchFixture = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fixtures?sport=${sport}`);
      const data = await res.json();
      setFixture(data.fixture ?? null);
      if (data.fixture?.groupCount) setGroupCount(data.fixture.groupCount);

      const tRes = await fetch("/api/teams");
      const tData = await tRes.json();
      const list = tData.teams ?? tData;
      if (Array.isArray(list)) setTeams(list.filter((t: TeamInfo & { status: string }) => t.status === "READY"));

      const pRes = await fetch("/api/pickleball");
      const pData = await pRes.json();
      const pbList = pData.registrations ?? (Array.isArray(pData) ? pData : []);
      const pbPending = pData.pendingRegistrations ?? [];
      setPbRegs([...pbList, ...pbPending]);
    } catch {
      toast("Failed to load fixtures", "error");
    } finally {
      setLoading(false);
    }
  }, [sport, toast]);

  useEffect(() => {
    fetchFixture();
  }, [fetchFixture]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/fixtures/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, groupCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Generated ${data.generated} matches`, "success");
      fetchFixture();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const toggleFreeze = async (category?: string) => {
    if (!fixture) return;
    const isCricket = sport === "CRICKET";

    let action: string;
    if (isCricket) {
      action = fixture.status === "FROZEN" ? "unfreeze" : "freeze";
    } else {
      const frozen = fixture.frozenCategories || [];
      action = category && frozen.includes(category) ? "unfreeze" : "freeze";
    }

    try {
      const res = await fetch("/api/admin/fixtures/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport, action, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`${category || "Fixture"} ${action}d`, "success");
      fetchFixture();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const getTeamName = (id: string | null) => {
    if (!id) return "TBD";
    if (id.startsWith("WINNER_") || id.startsWith("RUNNER_")) return id.replace(/_/g, " ");
    const t = teams.find((t) => t.id === id);
    return t?.name ?? "Unknown";
  };

  const getTeamColor = (id: string | null) => {
    if (!id) return undefined;
    return teams.find((t) => t.id === id)?.color;
  };

  const getEntryName = (id: string | null) => {
    if (!id) return "TBD";
    const r = pbRegs.find((r) => r.id === id);
    if (!r) return "Unknown";
    return r.player2Name ? `${r.player1Name} & ${r.player2Name}` : r.player1Name;
  };

  const isTBD = (id: string | null) => !id || id.startsWith("WINNER_") || id.startsWith("RUNNER_");

  const slotLabel = (match: MatchData, slot: "1" | "2") => {
    if (sport === "CRICKET") {
      return slot === "1" ? getTeamName(match.team1Id) : getTeamName(match.team2Id);
    }
    return slot === "1" ? getEntryName(match.entry1Id) : getEntryName(match.entry2Id);
  };

  const slotId = (match: MatchData, slot: "1" | "2") => {
    if (sport === "CRICKET") return slot === "1" ? match.team1Id : match.team2Id;
    return slot === "1" ? match.entry1Id : match.entry2Id;
  };

  const slotColor = (match: MatchData, slot: "1" | "2") => {
    if (sport === "CRICKET") return slot === "1" ? getTeamColor(match.team1Id) : getTeamColor(match.team2Id);
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !fixture) return;

    const [srcMatchId, srcSlot] = (active.id as string).split("__");
    const [dstMatchId, dstSlot] = (over.id as string).split("__");

    if (srcMatchId === dstMatchId && srcSlot === dstSlot) return;

    try {
      const res = await fetch("/api/admin/fixtures/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          matchId1: srcMatchId,
          matchId2: dstMatchId,
          slot1: srcSlot,
          slot2: dstSlot,
        }),
      });
      if (!res.ok) throw new Error("Swap failed");
      toast("Swapped", "success");
      fetchFixture();
    } catch {
      toast("Swap failed", "error");
    }
  };

  const scheduleMatch = async (matchId: string, date: string, venue: string, notify: boolean) => {
    try {
      const res = await fetch("/api/admin/fixtures/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, scheduledDate: date || undefined, venue: venue || undefined, sendNotification: notify }),
      });
      if (!res.ok) throw new Error("Schedule failed");
      toast(notify ? "Scheduled & notified" : "Scheduled", "success");
      fetchFixture();
    } catch {
      toast("Schedule failed", "error");
    }
  };

  const bulkSchedule = async (matchIds: string[], notify: boolean) => {
    try {
      const res = await fetch("/api/admin/fixtures/bulk-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchIds, scheduledDate: bulkDate || undefined, venue: bulkVenue || undefined, sendNotification: notify }),
      });
      if (!res.ok) throw new Error("Bulk schedule failed");
      toast("Bulk schedule applied", "success");
      fetchFixture();
    } catch {
      toast("Failed", "error");
    }
  };

  const recordScore = async (matchId: string, score1: string, score2: string, winnerId: string) => {
    try {
      const res = await fetch("/api/admin/fixtures/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, score1, score2, winnerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Score entry failed");
      toast("Score recorded & bracket updated", "success");
      fetchFixture();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Score entry failed", "error");
    }
  };

  const updateLiveScore = async (matchId: string, score1: string, score2: string) => {
    try {
      const res = await fetch("/api/admin/fixtures/live-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, score1, score2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast("Live score updated", "success");
      fetchFixture();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const toggleLive = async (matchId: string, goLive: boolean) => {
    try {
      const res = await fetch("/api/admin/fixtures/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, live: goLive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast(goLive ? "Match is now LIVE" : "Match taken off live", "success");
      fetchFixture();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-200">Access Denied</h1>
      </div>
    );
  }

  const matches = fixture?.matches ?? [];
  const groupMatches = matches.filter((m) => m.stage === "GROUP");
  const knockoutMatches = matches.filter((m) => m.stage === "KNOCKOUT");
  const groups = [...new Set(groupMatches.map((m) => m.groupName))].sort();

  const pbCategories = [...new Set(matches.map((m) => m.category).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Fixture Manager</h1>
        <p className="mt-1 text-slate-500">Generate, edit, and freeze tournament fixtures</p>
      </div>

      {/* Sport Toggle */}
      <div className="flex items-center gap-3 mb-6">
        {(["PICKLEBALL", "CRICKET"] as Sport[]).map((s) => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              sport === s
                ? s === "CRICKET"
                  ? "bg-pitch-500 text-white shadow-lg"
                  : "bg-emerald-500 text-white shadow-lg"
                : "text-slate-400 bg-dark-400 hover:bg-white/[0.06]"
            }`}
          >
            {s === "CRICKET" ? "Cricket" : "Pickleball"}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="dark-card rounded-2xl p-5 mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {sport === "CRICKET" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Groups</label>
              <input
                type="number"
                min={2}
                max={8}
                value={groupCount}
                onChange={(e) => setGroupCount(parseInt(e.target.value) || 4)}
                className="w-20 px-3 py-2 bg-dark-500 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            {generating ? "Generating..." : fixture ? "Regenerate" : "Generate Fixtures"}
          </button>
          {fixture && sport === "CRICKET" && (
            <button
              onClick={() => toggleFreeze()}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                fixture.status === "FROZEN"
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                  : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
              }`}
            >
              {fixture.status === "FROZEN" ? "Unfreeze" : "Freeze"}
            </button>
          )}
          {fixture && sport === "PICKLEBALL" && (
            <div className="flex flex-wrap gap-1.5">
              {PB_CATS.map((cat) => {
                const frozen = (fixture.frozenCategories || []).includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleFreeze(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      frozen
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-slate-500/10 text-slate-500 border border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    {frozen ? "🔒" : "🔓"} {PB_CAT_LABELS[cat]?.split(" ")[0]?.slice(0, 1)}{PB_CAT_LABELS[cat]?.split(" ")[1]?.charAt(0) || ""}
                  </button>
                );
              })}
            </div>
          )}
          {fixture && sport === "CRICKET" && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              fixture.status === "FROZEN"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
            }`}>
              {fixture.status} &middot; {matches.length} matches
            </span>
          )}
          {fixture && sport === "PICKLEBALL" && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
              {(fixture.frozenCategories || []).length}/5 frozen &middot; {matches.length} matches
            </span>
          )}
        </div>

        {/* Bulk Schedule */}
        {(fixture?.status === "FROZEN" || (fixture?.frozenCategories || []).length > 0) && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bulk Date/Time</label>
              <input
                type="datetime-local"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="px-3 py-2 bg-dark-500 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bulk Venue</label>
              <input
                type="text"
                value={bulkVenue}
                onChange={(e) => setBulkVenue(e.target.value)}
                placeholder="e.g. Court A"
                className="px-3 py-2 bg-dark-500 border border-white/10 rounded-lg text-white text-sm w-48"
              />
            </div>
            <button
              onClick={() => bulkSchedule(matches.map((m) => m.id), false)}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-500/30 border border-blue-500/20"
            >
              Apply to All
            </button>
            <button
              onClick={() => bulkSchedule(matches.map((m) => m.id), true)}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-500/30 border border-emerald-500/20"
            >
              Apply & Notify All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-brand-500" />
        </div>
      ) : !fixture || matches.length === 0 ? (
        <div className="dark-card rounded-2xl p-12 text-center">
          <p className="text-slate-500">No fixtures generated yet. Click &quot;Generate Fixtures&quot; above.</p>
        </div>
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Cricket Groups */}
          {sport === "CRICKET" && groups.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Group Stage</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((g) => {
                  const gm = groupMatches.filter((m) => m.groupName === g);
                  return (
                    <div key={g} className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0e14] border border-white/[0.06] overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-brand-500/10 to-transparent border-b border-white/[0.06]">
                        <h3 className="text-sm font-bold text-white">Group {g}</h3>
                        <span className="text-xs text-slate-500">{gm.length} matches</span>
                      </div>
                      <div className="p-3 space-y-1.5">
                        {gm.map((m) => (
                          <GroupMatchCard
                            key={m.id}
                            match={m}
                            sport={sport}
                            slotLabel={slotLabel}
                            slotColor={slotColor}
                            slotId={slotId}
                            isTBD={isTBD}
                            isFrozen={fixture.status === "FROZEN"}
                            onSchedule={scheduleMatch}
                            onRecordScore={recordScore}
                            onUpdateLiveScore={updateLiveScore}
                            onToggleLive={toggleLive}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Knockout */}
          {sport === "CRICKET" && knockoutMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Knockout Stage</h2>
              <BracketView
                matches={knockoutMatches}
                sport={sport}
                slotLabel={slotLabel}
                slotColor={slotColor}
                slotId={slotId}
                isTBD={isTBD}
                isFrozen={fixture.status === "FROZEN"}
                onSchedule={scheduleMatch}
                onRecordScore={recordScore}
                onUpdateLiveScore={updateLiveScore}
                onToggleLive={toggleLive}
                accent="#f59e0b"
              />
            </div>
          )}

          {/* Pickleball by category */}
          {sport === "PICKLEBALL" &&
            pbCategories.map((cat) => {
              const catMatches = matches.filter((m) => m.category === cat);
              const catFrozen = (fixture.frozenCategories || []).includes(cat!);
              return (
                <div key={cat} className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-lg font-bold text-white">
                      {PB_CAT_LABELS[cat!] ?? cat}
                      <span className="text-xs text-slate-500 ml-2">{catMatches.length} matches</span>
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catFrozen ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"}`}>
                      {catFrozen ? "FROZEN" : "DRAFT"}
                    </span>
                  </div>
                  <BracketView
                    matches={catMatches}
                    sport={sport}
                    slotLabel={slotLabel}
                    slotColor={slotColor}
                    slotId={slotId}
                    isTBD={isTBD}
                    isFrozen={catFrozen}
                    onSchedule={scheduleMatch}
                    onRecordScore={recordScore}
                    onUpdateLiveScore={updateLiveScore}
                    onToggleLive={toggleLive}
                    accent="#10b981"
                  />
                </div>
              );
            })}

          <DragOverlay>
            {activeId && (() => {
              const [mId, s] = activeId.split("__");
              const m = matches.find((m) => m.id === mId);
              if (!m) return null;
              return (
                <div className="px-3 py-2 rounded-lg bg-brand-500/20 border border-brand-400 text-white text-sm font-bold shadow-xl">
                  {slotLabel(m, s as "1" | "2")}
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ─── Group Match Card (compact Challonge style with swap) ────
function GroupMatchCard({
  match,
  sport,
  slotLabel,
  slotColor,
  slotId,
  isTBD,
  isFrozen,
  onSchedule,
  onRecordScore,
  onUpdateLiveScore,
  onToggleLive,
}: {
  match: MatchData;
  sport: Sport;
  slotLabel: (m: MatchData, s: "1" | "2") => string;
  slotColor: (m: MatchData, s: "1" | "2") => string | undefined;
  slotId: (m: MatchData, s: "1" | "2") => string | null;
  isTBD: (id: string | null) => boolean;
  isFrozen: boolean;
  onSchedule: (id: string, date: string, venue: string, notify: boolean) => void;
  onRecordScore: (matchId: string, score1: string, score2: string, winnerId: string) => void;
  onUpdateLiveScore: (matchId: string, score1: string, score2: string) => void;
  onToggleLive: (matchId: string, goLive: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [s1, setS1] = useState(match.score1 ?? "");
  const [s2, setS2] = useState(match.score2 ?? "");
  const [date, setDate] = useState(match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : "");
  const [venue, setVenue] = useState(match.venue ?? "");

  const p1 = slotId(match, "1");
  const p2 = slotId(match, "2");
  const isCompleted = match.status === "COMPLETED";
  const isLive = match.status === "LIVE";
  const canScore = isFrozen && p1 && p2 && !isTBD(p1) && !isTBD(p2);

  return (
    <div className={`rounded-lg overflow-hidden border transition-all ${isCompleted ? "border-emerald-500/30 bg-emerald-500/[0.03]" : isLive ? "border-red-500/30 bg-red-500/[0.03]" : "border-white/[0.06] hover:border-white/[0.12]"}`}>
      <div className="flex items-center">
        <DroppableMatchCard match={match} slot="1">
          <DraggableSlot id={`${match.id}__1`} label={slotLabel(match, "1")} color={slotColor(match, "1")} isTBD={isTBD(slotId(match, "1"))} />
        </DroppableMatchCard>
        {isCompleted && match.score1 ? (
          <div className="h-[22px] w-[44px] flex items-center justify-center border-x border-white/[0.04] bg-white/[0.02]">
            <span className="text-[9px] font-black text-emerald-400">{match.score1}-{match.score2}</span>
          </div>
        ) : (
          <div className="h-[22px] w-[24px] flex items-center justify-center border-x border-white/[0.04] bg-white/[0.01]">
            <span className="text-[7px] font-black text-slate-600">VS</span>
          </div>
        )}
        <DroppableMatchCard match={match} slot="2">
          <DraggableSlot id={`${match.id}__2`} label={slotLabel(match, "2")} color={slotColor(match, "2")} isTBD={isTBD(slotId(match, "2"))} />
        </DroppableMatchCard>
        <div className="h-[22px] px-1.5 flex items-center bg-white/[0.01] border-l border-white/[0.04] gap-1">
          <span className="text-[7px] font-bold text-slate-600">M{match.matchNumber}</span>
          {isLive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />}
          {isCompleted && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
        </div>
      </div>
      {isFrozen && (
        <div className="px-2.5 py-1.5 border-t border-white/[0.04] bg-white/[0.01]">
          {scoring ? (
            <div className="flex flex-wrap gap-1.5 items-center">
              <input type="text" value={s1} onChange={(e) => setS1(e.target.value)} placeholder="Score 1" className="px-1.5 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[10px] w-16 text-center" />
              <span className="text-[10px] text-slate-500">vs</span>
              <input type="text" value={s2} onChange={(e) => setS2(e.target.value)} placeholder="Score 2" className="px-1.5 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[10px] w-16 text-center" />
              {isLive && <button onClick={() => { onUpdateLiveScore(match.id, s1, s2); }} className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold" title="Save scores without declaring winner">Save</button>}
              <button onClick={() => { if (p1) { onRecordScore(match.id, s1, s2, p1); setScoring(false); } }} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold" title={`${slotLabel(match, "1")} wins`}>
                {slotLabel(match, "1").slice(0, 6)} W
              </button>
              <button onClick={() => { if (p2) { onRecordScore(match.id, s1, s2, p2); setScoring(false); } }} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold" title={`${slotLabel(match, "2")} wins`}>
                {slotLabel(match, "2").slice(0, 6)} W
              </button>
              <button onClick={() => setScoring(false)} className="px-1.5 py-0.5 text-slate-500 text-[10px]">Cancel</button>
            </div>
          ) : !editing && !match.scheduledDate ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">+ Schedule</button>
              {canScore && !isCompleted && <button onClick={() => setScoring(true)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">+ Score</button>}
              {canScore && !isCompleted && !isLive && <button onClick={() => onToggleLive(match.id, true)} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Go Live</button>}
              {isLive && <button onClick={() => onToggleLive(match.id, false)} className="text-[10px] text-amber-400 hover:text-amber-300 font-medium">End Live</button>}
              {isCompleted && match.winnerId && (
                <span className="text-[10px] text-emerald-400 font-medium">Winner: {match.winnerId === p1 ? slotLabel(match, "1") : slotLabel(match, "2")}</span>
              )}
            </div>
          ) : !editing && match.scheduledDate ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400 font-medium">{new Date(match.scheduledDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{match.venue && <span className="text-slate-500 ml-1">· {match.venue}</span>}</span>
              <div className="flex gap-1.5">
                {canScore && !isCompleted && <button onClick={() => setScoring(true)} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">Score</button>}
                {canScore && !isCompleted && !isLive && <button onClick={() => onToggleLive(match.id, true)} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Live</button>}
                {isLive && <button onClick={() => onToggleLive(match.id, false)} className="text-[10px] text-amber-400 hover:text-amber-300 font-medium">End</button>}
                {isCompleted && match.winnerId && (
                  <span className="text-[10px] text-emerald-400 font-medium">W: {match.winnerId === p1 ? slotLabel(match, "1") : slotLabel(match, "2")}</span>
                )}
                <button onClick={() => setEditing(true)} className="text-[10px] text-slate-500 hover:text-white">Edit</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 items-center">
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="px-1.5 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[10px]" />
              <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="px-1.5 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[10px] w-24" />
              <button onClick={() => { onSchedule(match.id, date, venue, false); setEditing(false); }} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">Save</button>
              <button onClick={() => { onSchedule(match.id, date, venue, true); setEditing(false); }} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">Notify</button>
              <button onClick={() => setEditing(false)} className="px-1.5 py-0.5 text-slate-500 text-[10px]">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Challonge-style Bracket View with drag-and-drop ────
function BracketView({
  matches,
  sport,
  slotLabel,
  slotColor,
  slotId,
  isTBD,
  isFrozen,
  onSchedule,
  onRecordScore,
  onUpdateLiveScore,
  onToggleLive,
  accent,
}: {
  matches: MatchData[];
  sport: Sport;
  slotLabel: (m: MatchData, s: "1" | "2") => string;
  slotColor: (m: MatchData, s: "1" | "2") => string | undefined;
  slotId: (m: MatchData, s: "1" | "2") => string | null;
  isTBD: (id: string | null) => boolean;
  isFrozen: boolean;
  onSchedule: (id: string, date: string, venue: string, notify: boolean) => void;
  onRecordScore: (matchId: string, score1: string, score2: string, winnerId: string) => void;
  onUpdateLiveScore: (matchId: string, score1: string, score2: string) => void;
  onToggleLive: (matchId: string, goLive: boolean) => void;
  accent: string;
}) {
  const rounds = [...new Set(matches.map(m => m.roundNumber))].sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const roundMatches: MatchData[][] = rounds.map(r => matches.filter(m => m.roundNumber === r));

  const MATCH_H = 56;
  const GAP = 8;
  const CELL = MATCH_H + GAP;

  const r0Count = roundMatches[0]?.length || 0;
  const totalH = Math.max(r0Count * CELL - GAP, MATCH_H);

  const maxRoundCount = Math.max(...roundMatches.map(rm => rm.length));
  const colW = Math.max(150, Math.min(180, Math.floor(900 / totalRounds)));
  const connW = Math.max(20, Math.min(32, Math.floor(colW * 0.18)));
  const totalW = totalRounds * (colW + connW) + 60;

  const getMatchY = (ri: number, mi: number): number => {
    if (ri === 0) return mi * CELL;
    const prevCount = roundMatches[ri - 1]?.length || 0;
    const c1 = mi * 2 < prevCount ? getMatchY(ri - 1, mi * 2) : mi * CELL;
    const c2 = mi * 2 + 1 < prevCount ? getMatchY(ri - 1, mi * 2 + 1) : c1 + CELL;
    return (c1 + c2) / 2;
  };

  const getRoundLabel = (ri: number) => {
    const remaining = totalRounds - ri;
    if (remaining === 1) return "Final";
    if (remaining === 2) return "Semi-Finals";
    if (remaining === 3) return "Quarter-Finals";
    return `Round ${ri + 1}`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#0a0e14] border border-white/[0.06] p-4 md:p-6 overflow-x-auto">
      <div style={{ minWidth: totalW }}>
      {/* Round headers */}
      <div className="flex mb-3">
        {rounds.map((_, ri) => {
          const isFinal = ri === totalRounds - 1;
          return (
            <div key={ri} style={{ width: colW + (ri < totalRounds - 1 ? connW : 0), flexShrink: 0 }} className="text-center">
              <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${isFinal ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-white/[0.03] text-slate-500 border-white/[0.06]"}`}>
                {getRoundLabel(ri)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bracket canvas */}
      <div className="relative" style={{ height: totalH }}>
        {/* SVG connectors */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: "visible" }}>
          {roundMatches.map((rm, ri) => {
            if (ri === totalRounds - 1) return null;
            const x1 = ri * (colW + connW) + colW;
            const x2 = x1 + connW;
            const xMid = x1 + connW / 2;
            return rm.map((_, mi) => {
              if (mi % 2 !== 0) return null;
              const topY = getMatchY(ri, mi) + MATCH_H / 2;
              const botY = getMatchY(ri, mi + 1) + MATCH_H / 2;
              const midY = (topY + botY) / 2;
              return (
                <g key={`${ri}-${mi}`}>
                  <line x1={x1} y1={topY} x2={xMid} y2={topY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                  <line x1={x1} y1={botY} x2={xMid} y2={botY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                  <line x1={xMid} y1={topY} x2={xMid} y2={botY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                  <line x1={xMid} y1={midY} x2={x2} y2={midY} stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" />
                  <circle cx={xMid} cy={midY} r="2" fill={accent} fillOpacity="0.4" />
                </g>
              );
            });
          })}
        </svg>

        {/* Match cards */}
        {roundMatches.map((rm, ri) => {
          const isFinalRound = ri === totalRounds - 1;
          const xOffset = ri * (colW + connW);
          return rm.map((m, mi) => {
            const y = getMatchY(ri, mi);
            return (
              <div key={m.id} className="absolute" style={{ left: xOffset, top: y, width: colW, minHeight: MATCH_H }}>
                <BracketMatchCard match={m} sport={sport} slotLabel={slotLabel} slotColor={slotColor} slotId={slotId} isTBD={isTBD} isFrozen={isFrozen} onSchedule={onSchedule} onRecordScore={onRecordScore} onUpdateLiveScore={onUpdateLiveScore} onToggleLive={onToggleLive} accent={accent} isFinal={isFinalRound} />
              </div>
            );
          });
        })}

        {/* Trophy */}
        {totalRounds > 0 && roundMatches[totalRounds - 1]?.length === 1 && (
          <div className="absolute flex items-center gap-2" style={{ left: (totalRounds - 1) * (colW + connW) + colW + 8, top: getMatchY(totalRounds - 1, 0) + MATCH_H / 2 - 14 }}>
            <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
              <span className="text-xs">🏆</span>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── Bracket Match Card with drag-and-drop ────
function BracketMatchCard({
  match,
  sport,
  slotLabel,
  slotColor,
  slotId,
  isTBD,
  isFrozen,
  onSchedule,
  onRecordScore,
  onUpdateLiveScore,
  onToggleLive,
  accent,
  isFinal,
}: {
  match: MatchData;
  sport: Sport;
  slotLabel: (m: MatchData, s: "1" | "2") => string;
  slotColor: (m: MatchData, s: "1" | "2") => string | undefined;
  slotId: (m: MatchData, s: "1" | "2") => string | null;
  isTBD: (id: string | null) => boolean;
  isFrozen: boolean;
  onSchedule: (id: string, date: string, venue: string, notify: boolean) => void;
  onRecordScore: (matchId: string, score1: string, score2: string, winnerId: string) => void;
  onUpdateLiveScore: (matchId: string, score1: string, score2: string) => void;
  onToggleLive: (matchId: string, goLive: boolean) => void;
  accent: string;
  isFinal: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [s1, setS1] = useState(match.score1 ?? "");
  const [s2, setS2] = useState(match.score2 ?? "");
  const [date, setDate] = useState(match.scheduledDate ? new Date(match.scheduledDate).toISOString().slice(0, 16) : "");
  const [venue, setVenue] = useState(match.venue ?? "");

  const p1 = slotId(match, "1");
  const p2 = slotId(match, "2");
  const isCompleted = match.status === "COMPLETED";
  const isLive = match.status === "LIVE";
  const canScore = isFrozen && p1 && p2 && !isTBD(p1) && !isTBD(p2);
  const isExpanded = scoring || editing;

  return (
    <div className={`rounded-lg border transition-all ${isExpanded ? "relative z-20" : ""} ${isCompleted ? "border-emerald-500/30 bg-emerald-500/[0.03]" : isLive ? "border-red-500/30 bg-red-500/[0.03]" : isFinal ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] to-transparent shadow-[0_0_20px_rgba(245,158,11,0.06)]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"}`} style={{ background: isExpanded ? "#0d1117" : undefined }}>
      {/* Slot 1 */}
      <DroppableMatchCard match={match} slot="1">
        <DraggableSlot id={`${match.id}__1`} label={slotLabel(match, "1")} color={slotColor(match, "1")} isTBD={isTBD(slotId(match, "1"))} />
      </DroppableMatchCard>
      {/* Divider */}
      <div className="h-[12px] flex items-center px-2 border-y border-white/[0.04]" style={{ background: `linear-gradient(90deg, ${accent}06, transparent)` }}>
        <span className="text-[7px] font-bold text-slate-600 tracking-wider">M{match.matchNumber}</span>
        {isLive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse ml-1" />}
        {isCompleted && match.score1 && (
          <span className="text-[7px] font-bold text-emerald-400 ml-1">{match.score1}-{match.score2}</span>
        )}
        <div className="flex-1" />
        {match.scheduledDate && !editing && (
          <span className="text-[7px] text-cyan-500/70 font-medium">{new Date(match.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        )}
        {isFrozen && !editing && !scoring && canScore && !isCompleted && (
          <button onClick={() => setScoring(true)} className="text-[7px] text-emerald-400 hover:text-emerald-300 ml-1">+sc</button>
        )}
        {isFrozen && canScore && !isCompleted && !isLive && !scoring && !editing && (
          <button onClick={() => onToggleLive(match.id, true)} className="text-[7px] text-red-400 hover:text-red-300 ml-0.5">▶</button>
        )}
        {isLive && !scoring && !editing && (
          <button onClick={() => onToggleLive(match.id, false)} className="text-[7px] text-amber-400 hover:text-amber-300 ml-0.5">■</button>
        )}
        {isFrozen && !match.scheduledDate && !editing && !scoring && (
          <button onClick={() => setEditing(true)} className="text-[7px] text-blue-400 hover:text-blue-300 ml-0.5">+t</button>
        )}
        {isFrozen && match.scheduledDate && !editing && !scoring && (
          <button onClick={() => setEditing(true)} className="text-[7px] text-slate-600 hover:text-white ml-0.5">✎</button>
        )}
      </div>
      {/* Slot 2 */}
      <DroppableMatchCard match={match} slot="2">
        <DraggableSlot id={`${match.id}__2`} label={slotLabel(match, "2")} color={slotColor(match, "2")} isTBD={isTBD(slotId(match, "2"))} />
      </DroppableMatchCard>
      {/* Score entry */}
      {scoring && (
        <div className="p-2 border-t border-white/[0.04] bg-white/[0.01] flex flex-wrap gap-1 items-center">
          <input type="text" value={s1} onChange={(e) => setS1(e.target.value)} placeholder="S1" className="px-1 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[9px] w-12 text-center" />
          <span className="text-[9px] text-slate-500">-</span>
          <input type="text" value={s2} onChange={(e) => setS2(e.target.value)} placeholder="S2" className="px-1 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[9px] w-12 text-center" />
          {isLive && <button onClick={() => { onUpdateLiveScore(match.id, s1, s2); }} className="px-1 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold" title="Save scores without declaring winner">Save</button>}
          <button onClick={() => { if (p1) { onRecordScore(match.id, s1, s2, p1); setScoring(false); } }} className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold" title={`${slotLabel(match, "1")} wins`}>1W</button>
          <button onClick={() => { if (p2) { onRecordScore(match.id, s1, s2, p2); setScoring(false); } }} className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[9px] font-bold" title={`${slotLabel(match, "2")} wins`}>2W</button>
          <button onClick={() => setScoring(false)} className="px-1 py-0.5 text-slate-500 text-[9px]">✕</button>
        </div>
      )}
      {/* Schedule editor */}
      {editing && (
        <div className="p-2 border-t border-white/[0.04] bg-white/[0.01] flex flex-wrap gap-1 items-center">
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="px-1 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[9px] w-[135px]" />
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="px-1 py-0.5 bg-dark-500 border border-white/10 rounded text-white text-[9px] w-16" />
          <button onClick={() => { onSchedule(match.id, date, venue, false); setEditing(false); }} className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[9px] font-bold">✓</button>
          <button onClick={() => { onSchedule(match.id, date, venue, true); setEditing(false); }} className="px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">✓📧</button>
          <button onClick={() => setEditing(false)} className="px-1 py-0.5 text-slate-500 text-[9px]">✕</button>
        </div>
      )}
    </div>
  );
}
