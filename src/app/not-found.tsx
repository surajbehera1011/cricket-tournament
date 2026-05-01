import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-white/10 select-none mb-2">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-brand-500/25"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/register?sport=pickleball"
            className="px-5 py-2.5 bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
