export default function ManageLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-white/[0.06] rounded mb-2" />
      <div className="h-4 w-72 bg-white/[0.03] rounded mb-6" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-white/[0.03]" />
        <div className="h-96 rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  );
}
