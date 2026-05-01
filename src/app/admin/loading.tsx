export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-40 bg-white/[0.06] rounded mb-2" />
      <div className="h-4 w-64 bg-white/[0.03] rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
