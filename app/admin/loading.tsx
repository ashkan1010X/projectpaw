export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-lg bg-paw/10" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-paw/5" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded-lg bg-paw/10" />
      </div>
      <div className="rounded-xl border border-paw/[0.08] bg-[#1a1612]">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[2fr_70px_100px_60px_100px] gap-2 border-b border-paw/[0.05] px-5 py-3.5 last:border-0"
          >
            <div className="flex items-center gap-2">
              <div className="size-7 animate-pulse rounded-lg bg-paw/10" />
              <div className="h-4 w-24 animate-pulse rounded bg-paw/10" />
            </div>
            <div className="h-4 w-10 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-14 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-6 animate-pulse rounded bg-paw/10" />
            <div className="h-4 w-16 animate-pulse rounded bg-paw/10" />
          </div>
        ))}
      </div>
    </main>
  );
}
