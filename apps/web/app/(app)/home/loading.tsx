export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/20">
      {/* Top bar skeleton */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600" />
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4">
        <div className="h-5 w-36 bg-gray-200/60 rounded-lg animate-pulse" />
        <div className="h-3 w-52 bg-gray-100/60 rounded-lg animate-pulse mt-2" />
      </div>

      {/* Tour card skeletons */}
      <div className="px-4 py-4 space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-100/40 overflow-hidden animate-pulse"
          >
            {/* Cover image placeholder */}
            <div className="h-36 bg-orange-50/60" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gray-200/60 rounded" />
                <div className="h-4 w-48 bg-gray-200/60 rounded-lg" />
              </div>
              <div className="h-3 w-32 bg-gray-100/60 rounded-lg" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-40 bg-gray-100/60 rounded-lg" />
                <div className="h-6 w-20 bg-orange-50/80 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
