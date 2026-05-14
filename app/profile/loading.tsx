export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-paw/[0.08]" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-paw/[0.05]" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
          <div className="mb-5 h-3 w-24 animate-pulse rounded bg-paw/[0.08]" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-paw/[0.05]" />
              <div className="h-11 animate-pulse rounded-xl bg-paw/[0.08]" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-paw/[0.08] bg-[#1a1612] p-6">
          <div className="mb-5 h-3 w-20 animate-pulse rounded bg-paw/[0.08]" />
          <div className="mb-5 flex justify-center">
            <div className="size-[108px] animate-pulse rounded-full bg-paw/[0.08]" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="mb-4">
              <div className="mb-2 h-3 w-16 animate-pulse rounded bg-paw/[0.05]" />
              <div className="h-11 animate-pulse rounded-xl bg-paw/[0.08]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
