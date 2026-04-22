"use client";

interface PickleballReg {
  id: string;
  category: string;
  player1Name: string;
  player1Email: string;
  player2Name: string | null;
  player2Email: string | null;
}

interface PickleballDashboardProps {
  registrations: PickleballReg[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  MENS_SINGLES: { label: "Men's Singles", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" },
  WOMENS_SINGLES: { label: "Women's Singles", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
  MENS_DOUBLES: { label: "Men's Doubles", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  WOMENS_DOUBLES: { label: "Women's Doubles", color: "text-fuchsia-700", bg: "bg-fuchsia-50", border: "border-fuchsia-200" },
  MIXED_DOUBLES: { label: "Mixed Doubles", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
};

export function PickleballDashboard({ registrations }: PickleballDashboardProps) {
  const categories = Object.keys(CATEGORY_LABELS);
  const grouped = categories.map((cat) => ({
    key: cat,
    ...CATEGORY_LABELS[cat],
    entries: registrations.filter((r) => r.category === cat),
  }));

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-5xl mb-4 block">🏓</span>
        <p className="text-slate-400 font-medium">No pickleball registrations yet</p>
        <p className="text-slate-300 text-sm mt-1">Registrations will appear here once approved by admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {grouped.map((g) => (
          <div key={g.key} className={`rounded-xl p-3 text-center ${g.bg} border ${g.border}`}>
            <p className={`text-2xl font-extrabold ${g.color}`}>{g.entries.length}</p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{g.label}</p>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {grouped.filter((g) => g.entries.length > 0).map((g) => {
        const isSingles = g.key.includes("SINGLES");
        return (
          <div key={g.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${g.bg} ${g.color} ${g.border} border`}>
                {g.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">({g.entries.length})</span>
            </div>
            <div className={`grid gap-2 ${isSingles ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
              {g.entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`bg-white rounded-xl border ${g.border} p-3.5 hover:shadow-sm transition-all`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${g.bg} ${g.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {entry.player1Name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{entry.player1Name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{entry.player1Email}</p>
                    </div>
                  </div>
                  {!isSingles && entry.player2Name && (
                    <div className="flex items-center gap-2.5 mt-2 pt-2 border-t border-slate-100">
                      <div className={`w-8 h-8 rounded-full ${g.bg} ${g.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {entry.player2Name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{entry.player2Name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{entry.player2Email}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
