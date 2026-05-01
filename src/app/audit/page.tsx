"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  actor: { displayName: string; email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ALL_ACTIONS = [
  "CREATE_TEAM", "REGISTER_TEAM", "REGISTER_INDIVIDUAL", "ASSIGN_PLAYER",
  "REMOVE_PLAYER", "MARK_COMPLETE", "MARK_INCOMPLETE", "UPDATE_SETTINGS",
  "APPROVE_TEAM", "REJECT_TEAM", "APPROVE_INDIVIDUAL", "REJECT_INDIVIDUAL",
  "CREATE_CAPTAIN", "UPDATE_CAPTAIN", "RECORD_SCORE",
];

const actionColors: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  CREATE_TEAM: "success",
  REGISTER_TEAM: "success",
  REGISTER_INDIVIDUAL: "info",
  ASSIGN_PLAYER: "info",
  REMOVE_PLAYER: "warning",
  MARK_COMPLETE: "success",
  MARK_INCOMPLETE: "danger",
  APPROVE_TEAM: "success",
  REJECT_TEAM: "danger",
  APPROVE_INDIVIDUAL: "success",
  REJECT_INDIVIDUAL: "danger",
  UPDATE_SETTINGS: "warning",
  CREATE_CAPTAIN: "info",
  UPDATE_CAPTAIN: "info",
  RECORD_SCORE: "success",
};

export default function AuditPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterAction, setFilterAction] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildQuery = (page: number) => {
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (filterAction) params.set("action", filterAction);
    if (filterSearch.trim()) params.set("search", filterSearch.trim());
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    return params.toString();
  };

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?${buildQuery(page)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Fetch audit logs failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchLogs(1);
  const clearFilters = () => {
    setFilterAction("");
    setFilterSearch("");
    setFilterFrom("");
    setFilterTo("");
    setTimeout(() => fetchLogs(1), 0);
  };

  const hasActiveFilters = filterAction || filterSearch.trim() || filterFrom || filterTo;

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-200">Access Denied</h1>
        <p className="mt-2 text-slate-400">Only administrators can view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Audit Log</h1>
        <p className="mt-1 text-slate-400">
          Track all changes made to teams and player assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Activity ({pagination.total} entries)</CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white transition-colors">
                  Clear filters
                </button>
              )}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  showFilters || hasActiveFilters
                    ? "bg-brand-500/20 text-brand-400"
                    : "bg-white/[0.06] text-slate-400 hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-brand-400" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Search</label>
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    placeholder="Actor, entity..."
                    className="w-full px-3 py-2 text-sm bg-dark-500 border border-white/[0.08] rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Action Type</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-500 border border-white/[0.08] rounded-lg text-slate-200 focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  >
                    <option value="">All actions</option>
                    {ALL_ACTIONS.map((a) => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-500 border border-white/[0.08] rounded-lg text-slate-200 focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-dark-500 border border-white/[0.08] rounded-lg text-slate-200 focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                {hasActiveFilters ? "No entries match your filters" : "No audit entries yet"}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-2 text-sm text-brand-400 hover:text-brand-300">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Time</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Actor</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Entity</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {logs.map((log) => (
                      <>
                        <tr key={log.id} className="hover:bg-white/[0.03]">
                          <td className="py-3 px-3 text-sm text-slate-400 whitespace-nowrap">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-slate-200">
                            {log.actor.displayName}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={actionColors[log.action] || "default"}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm text-slate-300">
                            {log.entityType}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                              className="text-sm text-brand-400 hover:text-brand-300 font-medium"
                            >
                              {expandedId === log.id ? "Hide" : "Show"}
                            </button>
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr key={`${log.id}-detail`}>
                            <td colSpan={5} className="px-3 py-4 bg-white/[0.02]">
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {log.before && (
                                  <div>
                                    <p className="font-semibold text-slate-400 mb-2">Before</p>
                                    <pre className="bg-dark-500 p-3 rounded-xl border border-white/[0.08] text-xs text-slate-300 overflow-auto whitespace-pre-wrap">
                                      {JSON.stringify(log.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.after && (
                                  <div>
                                    <p className="font-semibold text-slate-400 mb-2">After</p>
                                    <pre className="bg-dark-500 p-3 rounded-xl border border-white/[0.08] text-xs text-emerald-300 overflow-auto whitespace-pre-wrap">
                                      {JSON.stringify(log.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.08]">
                  <p className="text-sm text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchLogs(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchLogs(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
