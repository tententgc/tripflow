export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/20">
      {/* Top bar skeleton */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600" />
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4">
        <div className="h-5 w-28 bg-gray-200/60 rounded-lg animate-pulse" />
        <div className="h-3 w-44 bg-gray-100/60 rounded-lg animate-pulse mt-2" />
      </div>

      {/* Day card skeletons */}
      <div className="px-4 py-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-100/40 p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              {/* Day number badge */}
              <div className="w-11 h-11 bg-orange-50/80 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 bg-gray-200/60 rounded-lg" />
                <div className="h-3 w-2/5 bg-gray-100/60 rounded-lg" />
                {/* Meal badges row */}
                <div className="flex gap-2 pt-1">
                  <div className="h-5 w-16 bg-orange-50/60 rounded-full" />
                  <div className="h-5 w-16 bg-orange-50/60 rounded-full" />
                  <div className="h-5 w-16 bg-orange-50/60 rounded-full" />
                </div>
              </div>
              {/* Country flag placeholder */}
              <div className="w-6 h-4 bg-gray-200/60 rounded flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
