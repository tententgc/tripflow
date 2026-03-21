export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 pt-safe-top pb-10">
        <div className="pt-6 max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-3 w-16 bg-white/20 rounded mb-2" />
            <div className="h-6 w-48 bg-white/30 rounded" />
            <div className="h-3 w-32 bg-white/15 rounded mt-2" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20" />
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 pb-8 max-w-5xl mx-auto">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
