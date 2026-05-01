export default function AuditLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-32 bg-white/[0.06] rounded mb-2" />
      <div className="h-4 w-64 bg-white/[0.03] rounded mb-6" />
      <div className="rounded-2xl bg-white/[0.03] p-6">
        <div className="space-y-3">
          <div className="h-10 bg-white/[0.04] rounded" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/[0.02] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
