"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface StatusResult {
  sport: string;
  type: string;
  name: string;
  status: string;
  statusLabel: string;
  detail: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING_APPROVAL") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Pending Approval
      </span>
    );
  }
  if (status === "APPROVED" || status === "LOOKING_FOR_TEAM" || status === "READY") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        Approved
      </span>
    );
  }
  if (status === "INCOMPLETE" || status === "COMPLETE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-2 h-2 rounded-full bg-blue-400" />
        {status === "COMPLETE" ? "Submitted" : "In Progress"}
      </span>
    );
  }
  if (status === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
      {status}
    </span>
  );
}

function StatusContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [results, setResults] = useState<StatusResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/status?email=${encodeURIComponent(email.trim())}`, { cache: "no-store" });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="text-5xl mb-4 block">📋</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Check Registration Status
          </h1>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            Enter your email to see the status of all your registrations
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-brand-100/50 p-6 sm:p-8 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-brand-100/50 rounded-xl text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-600 mx-auto" />
            <p className="mt-4 text-slate-400 text-sm">Looking up your registrations...</p>
          </div>
        )}

        {!loading && searched && results !== null && (
          <>
            {results.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-100/50 p-8 text-center">
                <span className="text-4xl mb-4 block">🔍</span>
                <h2 className="text-lg font-bold text-slate-800 mb-2">No Registrations Found</h2>
                <p className="text-slate-400 text-sm mb-6">
                  We couldn&apos;t find any registrations associated with this email.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
                >
                  Register Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 font-medium">
                  Found {results.length} registration{results.length !== 1 ? "s" : ""} for <strong className="text-slate-700">{email}</strong>
                </p>
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-sm border border-brand-100/50 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{r.sport === "Cricket" ? "🏏" : "🏓"}</span>
                          <h3 className="text-base font-bold text-slate-800 truncate">{r.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          {r.sport} &middot; {r.type} &middot; Registered {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <StatusBadge status={r.status} />
                        {r.status === "PENDING_APPROVAL" && (
                          <p className="text-xs text-amber-600 mt-2">
                            Your registration is awaiting admin approval. It will appear on the dashboard once approved.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Back to dashboard */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mx-auto" />
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
