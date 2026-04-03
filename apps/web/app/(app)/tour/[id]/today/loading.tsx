export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/20">
      {/* Top bar skeleton */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600" />

      {/* Hero skeleton */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 py-5 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-4 bg-gray-200/60 rounded" />
          <div className="h-5 w-40 bg-gray-200/60 rounded-lg" />
        </div>
        <div className="h-3 w-56 bg-gray-100/60 rounded-lg" />
        {/* Meal badges skeleton */}
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-24 bg-orange-50/60 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Weather card skeleton */}
      <div className="px-4 pt-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-100/40 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-16 bg-gray-200/60 rounded-lg" />
              <div className="h-3 w-24 bg-gray-100/60 rounded-lg" />
            </div>
            <div className="w-12 h-12 bg-orange-50/80 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Timeline items skeleton */}
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-100/40 p-4 animate-pulse"
          >
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-orange-50/80 rounded-xl" />
                {i < 3 && (
                  <div className="w-0.5 h-8 bg-orange-100/40 mt-2" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-14 bg-orange-100/60 rounded" />
                <div className="h-4 w-3/4 bg-gray-200/60 rounded-lg" />
                <div className="h-3 w-1/2 bg-gray-100/60 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
