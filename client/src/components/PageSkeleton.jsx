/** Full-page loading skeleton — Suspense fallback for lazy routes */
export function PageSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" aria-busy="true" aria-label="Loading page">
      {/* Fake sidebar */}
      <div className="hidden md:block w-56 shrink-0 bg-slate-900" />
      {/* Fake main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-14 bg-white border-b border-slate-200" />
        <div className="flex-1 p-6 space-y-4 max-w-5xl mx-auto w-full">
          <div className="skeleton h-7 w-48 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Reusable skeleton card — drop-in for content panels */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-4 space-y-2.5" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{
            width:          i === 0 ? '55%' : `${88 - i * 10}%`,
            animationDelay: `${i * 60}ms`
          }}
        />
      ))}
    </div>
  )
}

/** Single skeleton table row */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3" aria-hidden="true">
      <div className="skeleton h-4 w-8 rounded" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-20 rounded" />
      <div className="skeleton h-4 w-14 rounded" />
    </div>
  )
}
