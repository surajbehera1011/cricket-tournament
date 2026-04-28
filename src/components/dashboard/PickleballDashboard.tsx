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
  { key: "MENS_SINGLES", label: "Men's Singles", icon: "🏓", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", accent: "bg-sky-500" },
  { key: "WOMENS_SINGLES", label: "Women's Singles", icon: "🏓", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", accent: "bg-pink-500" },
  { key: "MENS_DOUBLES", label: "Men's Doubles", icon: "🏓🏓", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", accent: "bg-blue-500" },
  { key: "WOMENS_DOUBLES", label: "Women's Doubles", icon: "🏓🏓", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", accent: "bg-fuchsia-500" },
  { key: "MIXED_DOUBLES", label: "Mixed Doubles", icon: "🏓🏓", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", accent: "bg-violet-500" },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="dark-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`h-1.5 ${cat.accent}`} />
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">{cat.label}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{entries.length} registration{entries.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors text-xl">&times;</button>
          </div>
        </div>
        <div className="border-t border-white/[0.04] overflow-y-auto max-h-[60vh] p-6 pt-4 space-y-2">
          {entries.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No registrations in this category</p>
          ) : (
            entries.map((entry, idx) => (
              <div key={entry.id} className={`rounded-xl ${cat.bg} p-3.5 border ${cat.border}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cat.bg} ${cat.color} border ${cat.border}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{entry.player1Name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{entry.player1Email}</p>
                  </div>
                </div>
                {!isSingles && entry.player2Name && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/[0.06]">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                      &
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">{entry.player2Name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{entry.player2Email}</p>
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
  const [venue, setVenue] = useState("");
  const [venueMapUrl, setVenueMapUrl] = useState("");
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
      setVenue(settings?.pickleballVenue || "");
      setVenueMapUrl(settings?.pickleballVenueMapUrl || "");
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-emerald-500 mx-auto" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🏓</span>
          </div>
          <p className="mt-4 text-slate-500 font-medium">Loading pickleball data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {openCatData && (
        <CategoryModal cat={openCatData} entries={openCatData.entries} onClose={() => setOpenCat(null)} />
      )}

      {startDate && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex justify-center">
          <Countdown targetDate={startDate} />
        </div>
      )}

      {/* Venue */}
      {venue && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-dark-400/60 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.07] via-transparent to-emerald-500/[0.07]" />
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 rounded-l-2xl" />
            <div className="relative flex items-center gap-4 px-6 py-4">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-400 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-1">Match Venue</p>
                <p className="text-[15px] font-bold text-white leading-tight">{venue}</p>
              </div>
              {venueMapUrl && (
                <a
                  href={venueMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all flex-shrink-0"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Get Directions
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {regCloseDate && new Date(regCloseDate).getTime() > Date.now() && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-lg">⏰</span>
            <p className="text-amber-400">
              <span className="font-bold">Register soon!</span>{" "}
              Pickleball registration closes by{" "}
              <span className="font-bold">{new Date(regCloseDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </p>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="stat-card">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-2xl" />
            <div className="p-5 text-center">
              <span className="text-2xl mb-1 block">🏓</span>
              <p className="text-3xl font-extrabold text-emerald-400 tabular-nums">{totalAnim}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-widest">Total</p>
            </div>
          </div>
          {grouped.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setOpenCat(cat.key)}
              className="stat-card cursor-pointer text-left"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${cat.accent} rounded-t-2xl`} />
              <div className="p-5 text-center">
                <p className={`text-3xl font-extrabold ${cat.color} tabular-nums`}>{cat.total}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wider leading-tight">{cat.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-dark-400/60 border border-white/[0.06] rounded-2xl text-sm text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 shadow-sm placeholder:text-slate-500 backdrop-blur-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">&times;</button>
          )}
        </div>
      </div>

      {/* Entries by category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🏓</span>
            <p className="text-slate-400 font-medium">
              {registrations.length === 0 ? "No pickleball registrations yet" : "No matches for current search"}
            </p>
            <p className="text-slate-500 text-sm mt-1 mb-4">Registrations will appear here once approved by admin</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/status" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">Registered? Check your status &rarr;</a>
              <span className="text-slate-600">|</span>
              <a href="/register?sport=pickleball" className="text-sm text-pitch-400 hover:text-pitch-300 font-medium">Register now &rarr;</a>
            </div>
          </div>
        ) : (
          grouped.filter((g) => g.entries.length > 0).map((g) => {
            const isSingles = g.key.includes("SINGLES");
            return (
              <div key={g.key}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-1 h-7 rounded-full ${g.accent}`} />
                  <h2 className="text-lg font-bold text-white">{g.label}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.bg} ${g.color} ${g.border} border`}>{g.entries.length}</span>
                </div>
                <div className={`grid gap-3 ${isSingles ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {g.entries.map((entry) => (
                    <div key={entry.id} className={`bg-dark-400/60 rounded-2xl border ${g.border} p-4 hover:border-white/10 transition-all hover:-translate-y-0.5`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${g.bg} ${g.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {entry.player1Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{entry.player1Name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{entry.player1Email}</p>
                        </div>
                      </div>
                      {!isSingles && entry.player2Name && (
                        <>
                          <div className="flex items-center justify-center my-2">
                            <div className="h-px flex-1 bg-white/[0.04]" />
                            <span className="px-2 text-[10px] text-slate-500 font-medium">&</span>
                            <div className="h-px flex-1 bg-white/[0.04]" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${g.bg} ${g.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                              {entry.player2Name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{entry.player2Name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{entry.player2Email}</p>
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

        {/* Pending */}
        {filteredPending.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-7 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className="text-lg font-bold text-white">Awaiting Approval</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{filteredPending.length}</span>
            </div>
            <p className="text-sm text-slate-500 mb-4 ml-4">These registrations are pending admin review.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPending.map((entry) => {
                const isSingles = entry.category.includes("SINGLES");
                const catMeta = CATEGORIES.find((c) => c.key === entry.category);
                return (
                  <div key={entry.id} className="bg-amber-500/5 rounded-2xl border-2 border-dashed border-amber-500/20 p-4 opacity-75">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">Pending</span>
                      {catMeta && <span className="text-[10px] font-semibold text-slate-500">{catMeta.label}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{entry.player1Name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-300 truncate">{entry.player1Name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{entry.player1Email}</p>
                      </div>
                    </div>
                    {!isSingles && entry.player2Name && (
                      <>
                        <div className="flex items-center justify-center my-2">
                          <div className="h-px flex-1 bg-amber-500/10" />
                          <span className="px-2 text-[10px] text-amber-500/50 font-medium">&</span>
                          <div className="h-px flex-1 bg-amber-500/10" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{entry.player2Name.charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-300 truncate">{entry.player2Name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{entry.player2Email}</p>
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
      </div>
    </div>
  );
}
