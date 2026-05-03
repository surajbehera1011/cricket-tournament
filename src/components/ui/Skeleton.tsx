"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] animate-shimmer ${className}`}
    />
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="p-5 text-center space-y-3">
            <Skeleton className="w-8 h-8 rounded-full mx-auto" />
            <Skeleton className="h-8 w-16 mx-auto rounded-lg" />
            <Skeleton className="h-3 w-20 mx-auto rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeamCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-dark-400/60 border-2 border-white/[0.06] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-3 w-40 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CricketDashboardSkeleton() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <StatsCardsSkeleton />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        <div>
          <Skeleton className="h-6 w-32 rounded-lg mb-5" />
          <TeamCardsSkeleton count={4} />
        </div>
        <div>
          <Skeleton className="h-6 w-32 rounded-lg mb-5" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PickleballDashboardSkeleton() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="p-5 text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto rounded-lg" />
                <Skeleton className="h-3 w-16 mx-auto rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-6 w-40 rounded-lg mb-4" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
