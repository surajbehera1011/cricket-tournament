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

const actionColors: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  CREATE_TEAM: "success",
  REGISTER_TEAM: "success",
  REGISTER_INDIVIDUAL: "info",
  ASSIGN_PLAYER: "info",
  REMOVE_PLAYER: "warning",
  MARK_COMPLETE: "success",
  MARK_INCOMPLETE: "danger",
};

export default function AuditPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${page}&limit=25`);
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
  }, []);

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-500">Only administrators can view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Audit Log</h1>
        <p className="mt-1 text-slate-500">
          Track all changes made to teams and player assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity ({pagination.total} entries)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No audit entries yet</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-50">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Time</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Actor</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Entity</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-slate-400 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {logs.map((log) => (
                      <>
                        <tr key={log.id} className="hover:bg-brand-50/30">
                          <td className="py-3 px-3 text-sm text-slate-500 whitespace-nowrap">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-slate-800">
                            {log.actor.displayName}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={actionColors[log.action] || "default"}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm text-slate-600">
                            {log.entityType}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                            >
                              {expandedId === log.id ? "Hide" : "Show"}
                            </button>
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr key={`${log.id}-detail`}>
                            <td colSpan={5} className="px-3 py-3 bg-surface-50">
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {log.before && (
                                  <div>
                                    <p className="font-medium text-slate-500 mb-1">Before</p>
                                    <pre className="bg-white p-3 rounded-xl border border-brand-100/50 text-xs overflow-auto">
                                      {JSON.stringify(log.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.after && (
                                  <div>
                                    <p className="font-medium text-slate-500 mb-1">After</p>
                                    <pre className="bg-white p-3 rounded-xl border border-brand-100/50 text-xs overflow-auto">
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
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-50">
                  <p className="text-sm text-slate-500">
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
