export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-paw/10" />
        <div className="h-4 w-64 animate-pulse rounded bg-paw/[0.06]" />
      </div>

      {/* Stats row skeleton */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-paw/[0.08] bg-[#1a1612] p-6"
          >
            <div className="mb-2 h-8 w-10 rounded bg-paw/10" />
            <div className="h-3 w-20 rounded bg-paw/[0.06]" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-paw/[0.08] bg-[#1a1612] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-paw/10" />
                <div className="h-3 w-48 rounded bg-paw/[0.06]" />
              </div>
              <div className="h-6 w-20 rounded-full bg-paw/10" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
