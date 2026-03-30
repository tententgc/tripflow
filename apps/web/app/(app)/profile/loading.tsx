export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/20">
      {/* Top bar skeleton */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600" />
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4">
        <div className="h-5 w-24 bg-gray-200/60 rounded-lg animate-pulse" />
      </div>

      {/* Avatar + name section */}
      <div className="flex flex-col items-center py-8 animate-pulse">
        <div className="w-24 h-24 bg-orange-50/80 rounded-full" />
        <div className="h-5 w-36 bg-gray-200/60 rounded-lg mt-4" />
        <div className="h-3 w-48 bg-gray-100/60 rounded-lg mt-2" />
      </div>

      {/* Form section skeletons */}
      <div className="px-4 space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-orange-100/40 p-4 animate-pulse"
          >
            <div className="h-4 w-32 bg-gray-200/60 rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-3 w-20 bg-gray-100/60 rounded" />
                  <div className="h-10 w-full bg-gray-50/80 rounded-xl border border-gray-200/40" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
