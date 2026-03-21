export default function ToursLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-pulse">
      {/* Header with action button */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="h-7 w-32 bg-gray-200/60 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100/60 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-36 bg-indigo-100/40 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-4 h-20"
          />
        ))}
      </div>

      {/* Tour cards — active section */}
      <div className="space-y-8">
        <div>
          <div className="h-5 w-36 bg-gray-200/60 rounded-lg mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden"
              >
                <div className="h-36 bg-gray-100/60" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-100/60 rounded" />
                    <div className="h-5 w-40 bg-gray-100/60 rounded" />
                  </div>
                  <div className="h-3.5 w-48 bg-gray-100/40 rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-20 bg-gray-100/40 rounded-full" />
                    <div className="h-4 w-16 bg-gray-100/40 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tour cards — draft section */}
        <div>
          <div className="h-5 w-24 bg-gray-200/60 rounded-lg mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden"
              >
                <div className="h-36 bg-gray-100/60" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-36 bg-gray-100/60 rounded" />
                  <div className="h-3.5 w-44 bg-gray-100/40 rounded" />
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-20 bg-gray-100/40 rounded-full" />
                    <div className="h-4 w-16 bg-gray-100/40 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
