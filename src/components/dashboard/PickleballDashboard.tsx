"use client";

import { useState, useEffect, useCallback } from "react";
import { Countdown } from "@/components/dashboard/Countdown";

interface PickleballReg {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
  status?: string;
}

const CATEGORIES = [
  { key: "MENS_SINGLES", label: "Men's Singles", icon: "🏓", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", accent: "bg-sky-500" },
  { key: "WOMENS_SINGLES", label: "Women's Singles", icon: "🏓", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500" },
  { key: "MENS_DOUBLES", label: "Men's Doubles", icon: "🏓🏓", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500" },
  { key: "WOMENS_DOUBLES", label: "Women's Doubles", icon: "🏓🏓", color: "text-fuchsia-700", bg: "bg-fuchsia-50", border: "border-fuchsia-200", accent: "bg-fuchsia-500" },
  { key: "MIXED_DOUBLES", label: "Mixed Doubles", icon: "🏓🏓", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500" },
];

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function CategoryModal({ cat, entries, onClose }: {
  cat: typeof CATEGORIES[number];
  entries: PickleballReg[];
  onClose: () => void;
}) {
  const isSingles = cat.key.includes("SINGLES");
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-brand-100/50" onClick={(e) => e.stopPropagation()}>
        <div className={`h-1.5 ${cat.accent}`} />
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800">{cat.label}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{entries.length} registration{entries.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50 text-slate-400 hover:text-slate-600 transition-colors text-xl">&times;</button>
          </div>
        </div>
        <div className="border-t border-brand-50 overflow-y-auto max-h-[60vh] p-6 pt-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No registrations in this category</p>
          ) : (
            entries.map((entry, idx) => (
              <div key={entry.id} className={`rounded-xl ${cat.bg} p-3.5 border ${cat.border}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSingles ? `${cat.bg} ${cat.color}` : "bg-white text-slate-600"} border ${cat.border}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{entry.player1Name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{entry.player1Email}</p>
                  </div>
                </div>
                {!isSingles && entry.player2Name && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/60">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white/60 text-slate-500 border border-white">
                      &
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{entry.player2Name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{entry.player2Email}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PickleballDashboard() {
  const [registrations, setRegistrations] = useState<PickleballReg[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PickleballReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [regCloseDate, setRegCloseDate] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const [res, settingsRes] = await Promise.all([
        fetch(`/api/pickleball?_t=${ts}`, { cache: "no-store" }),
        fetch(`/api/settings?_t=${ts}`, { cache: "no-store" }),
      ]);
      const data = await res.json();
      const settings = await settingsRes.json();
      if (data && Array.isArray(data.registrations)) {
        setRegistrations(data.registrations);
        setPendingRegistrations(data.pendingRegistrations || []);
      } else if (Array.isArray(data)) {
        setRegistrations(data);
      }
      setStartDate(settings?.pickleballStartDate || settings?.tournamentStartDate || null);
      setRegCloseDate(settings?.pickleballRegCloseDate || null);
    } catch (err) {
      console.error("Failed to fetch pickleball data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const q = search.toLowerCase();
  const filtered = registrations.filter((r) => {
    if (q) {
      return r.player1Name.toLowerCase().includes(q) ||
        r.player1Email.toLowerCase().includes(q) ||
        r.player2Name?.toLowerCase().includes(q) ||
        r.player2Email?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPending = pendingRegistrations.filter((r) => {
    if (q) {
      return r.player1Name.toLowerCase().includes(q) ||
        r.player1Email.toLowerCase().includes(q) ||
        r.player2Name?.toLowerCase().includes(q) ||
        r.player2Email?.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    entries: filtered.filter((r) => r.category === cat.key),
    total: registrations.filter((r) => r.category === cat.key).length,
  }));

  const totalAnim = useCountUp(registrations.length);
  const openCatData = openCat ? grouped.find((g) => g.key === openCat) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🏓</span>
          </div>
          <p className="mt-4 text-slate-400 font-medium">Loading pickleball data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Modal */}
      {openCatData && (
        <CategoryModal cat={openCatData} entries={openCatData.entries} onClose={() => setOpenCat(null)} />
      )}

      {/* Countdown */}
      {startDate && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-center">
          <Countdown targetDate={startDate} />
        </div>
      )}

      {/* Registration closing banner */}
      {regCloseDate && new Date(regCloseDate).getTime() > Date.now() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-lg">⏰</span>
            <p className="text-amber-800">
              <span className="font-bold">Register soon!</span>{" "}
              Pickleball registration closes by{" "}
              <span className="font-bold">{new Date(regCloseDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          </div>
        </div>
      )}

      {/* Category Cards - clickable like cricket team cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="stat-card bg-emerald-50 border-emerald-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-2xl" />
            <div className="p-5 text-center">
              <span className="text-2xl mb-1 block">🏓</span>
              <p className="text-3xl font-extrabold text-emerald-700 tabular-nums">{totalAnim}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Total</p>
            </div>
          </div>
          {grouped.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setOpenCat(cat.key)}
              className={`stat-card ${cat.bg} ${cat.border} cursor-pointer text-left hover:shadow-lg hover:-translate-y-1 transition-all`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${cat.accent} rounded-t-2xl`} />
              <div className="p-5 text-center">
                <p className={`text-3xl font-extrabold ${cat.color} tabular-nums`}>{cat.total}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider leading-tight">{cat.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-100/50 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">&times;</button>
          )}
        </div>
      </div>

      {/* All entries by category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🏓</span>
            <p className="text-slate-400 font-medium">
              {registrations.length === 0 ? "No pickleball registrations yet" : "No matches for current search"}
            </p>
            <p className="text-slate-300 text-sm mt-1 mb-4">Registrations will appear here once approved by admin</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/status" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Registered? Check your status &rarr;
              </a>
              <span className="text-slate-200">|</span>
              <a href="/register?sport=pickleball" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Register now &rarr;
              </a>
            </div>
          </div>
        ) : (
          grouped.filter((g) => g.entries.length > 0).map((g) => {
            const isSingles = g.key.includes("SINGLES");
            return (
              <div key={g.key}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-1 h-7 rounded-full ${g.accent}`} />
                  <h2 className="text-lg font-bold text-slate-800">{g.label}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.bg} ${g.color} ${g.border} border`}>
                    {g.entries.length}
                  </span>
                </div>
                <div className={`grid gap-3 ${isSingles ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {g.entries.map((entry) => (
                    <div key={entry.id} className={`bg-white rounded-2xl border ${g.border} p-4 hover:shadow-md transition-all hover:-translate-y-0.5`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${g.bg} ${g.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {entry.player1Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{entry.player1Name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{entry.player1Email}</p>
                        </div>
                      </div>
                      {!isSingles && entry.player2Name && (
                        <>
                          <div className="flex items-center justify-center my-2">
                            <div className="h-px flex-1 bg-slate-100" />
                            <span className="px-2 text-[10px] text-slate-400 font-medium">&</span>
                            <div className="h-px flex-1 bg-slate-100" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${g.bg} ${g.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                              {entry.player2Name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{entry.player2Name}</p>
                              <p className="text-[11px] text-slate-400 truncate">{entry.player2Email}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Pending Approval Section */}
        {filteredPending.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className="text-lg font-bold text-slate-800">Awaiting Approval</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {filteredPending.length}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4 ml-4">
              These registrations are pending admin review and will appear above once approved.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPending.map((entry) => {
                const isSingles = entry.category.includes("SINGLES");
                const catMeta = CATEGORIES.find((c) => c.key === entry.category);
                return (
                  <div key={entry.id} className="bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-200 p-4 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 uppercase">
                        Pending
                      </span>
                      {catMeta && (
                        <span className="text-[10px] font-semibold text-slate-400">{catMeta.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {entry.player1Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-600 truncate">{entry.player1Name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{entry.player1Email}</p>
                      </div>
                    </div>
                    {!isSingles && entry.player2Name && (
                      <>
                        <div className="flex items-center justify-center my-2">
                          <div className="h-px flex-1 bg-amber-200/50" />
                          <span className="px-2 text-[10px] text-amber-400 font-medium">&</span>
                          <div className="h-px flex-1 bg-amber-200/50" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {entry.player2Name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-600 truncate">{entry.player2Name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{entry.player2Email}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        )}
      </div>
    </div>
  );
}
