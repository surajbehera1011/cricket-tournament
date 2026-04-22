"use client";

import { useState, useEffect, useCallback } from "react";

interface PickleballReg {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
}

const CATEGORIES = [
  { key: "MENS_SINGLES", label: "Men's Singles", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", accent: "bg-sky-500" },
  { key: "WOMENS_SINGLES", label: "Women's Singles", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200", accent: "bg-pink-500" },
  { key: "MENS_DOUBLES", label: "Men's Doubles", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", accent: "bg-blue-500" },
  { key: "WOMENS_DOUBLES", label: "Women's Doubles", color: "text-fuchsia-700", bg: "bg-fuchsia-50", border: "border-fuchsia-200", accent: "bg-fuchsia-500" },
  { key: "MIXED_DOUBLES", label: "Mixed Doubles", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", accent: "bg-violet-500" },
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

export function PickleballDashboard() {
  const [registrations, setRegistrations] = useState<PickleballReg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/pickleball?_t=${ts}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch pickleball data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const q = search.toLowerCase();
  const filtered = registrations.filter((r) => {
    if (filterCat && r.category !== filterCat) return false;
    if (q) {
      const match =
        r.player1Name.toLowerCase().includes(q) ||
        r.player1Email.toLowerCase().includes(q) ||
        r.player2Name?.toLowerCase().includes(q) ||
        r.player2Email?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    entries: filtered.filter((r) => r.category === cat.key),
    total: registrations.filter((r) => r.category === cat.key).length,
  }));

  const totalAnim = useCountUp(registrations.length);

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
      {/* Stats Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total */}
          <div className="stat-card bg-emerald-50 border-emerald-100">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-2xl" />
            <div className="p-4 text-center">
              <span className="text-2xl mb-1 block">🏓</span>
              <p className="text-3xl font-extrabold text-emerald-700 tabular-nums">{totalAnim}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">Total</p>
            </div>
          </div>
          {CATEGORIES.map((cat) => {
            const count = registrations.filter((r) => r.category === cat.key).length;
            return (
              <div
                key={cat.key}
                className={`stat-card ${cat.bg} ${cat.border} cursor-pointer ${filterCat === cat.key ? "ring-2 ring-offset-1 ring-emerald-400" : ""}`}
                onClick={() => setFilterCat(filterCat === cat.key ? "" : cat.key)}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${cat.accent} rounded-t-2xl`} />
                <div className="p-4 text-center">
                  <p className={`text-2xl font-extrabold ${cat.color} tabular-nums`}>{count}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider leading-tight">{cat.label}</p>
                </div>
              </div>
            );
          })}
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
          {(search || filterCat) && (
            <button
              onClick={() => { setSearch(""); setFilterCat(""); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
            >
              Clear
            </button>
          )}
        </div>
        {filterCat && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Filtering:</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${CATEGORIES.find((c) => c.key === filterCat)?.bg} ${CATEGORIES.find((c) => c.key === filterCat)?.color} ${CATEGORIES.find((c) => c.key === filterCat)?.border} border`}>
              {CATEGORIES.find((c) => c.key === filterCat)?.label}
            </span>
            <button onClick={() => setFilterCat("")} className="text-xs text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🏓</span>
            <p className="text-slate-400 font-medium">
              {registrations.length === 0 ? "No pickleball registrations yet" : "No matches for current filters"}
            </p>
            <p className="text-slate-300 text-sm mt-1">Registrations will appear here once approved by admin</p>
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
                    <div
                      key={entry.id}
                      className={`bg-white rounded-2xl border ${g.border} p-4 hover:shadow-md transition-all hover:-translate-y-0.5`}
                    >
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
      </div>
    </div>
  );
}
