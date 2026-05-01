export default function ScheduleLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-52 bg-gradient-to-b from-indigo-950/30 to-transparent mb-8" />
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    </div>
  );
}
