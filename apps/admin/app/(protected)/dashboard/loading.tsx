export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-40 bg-gray-200/60 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100/60 rounded-lg mt-2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-5 h-24"
          />
        ))}
      </div>

      {/* Departing tour banner */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-5 h-28 mb-8" />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming tours table */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-5">
          <div className="h-5 w-32 bg-gray-200/60 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-100/60 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 bg-gray-100/60 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100/40 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-100/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent travelers */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-5">
            <div className="h-5 w-28 bg-gray-200/60 rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100/60 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-24 bg-gray-100/60 rounded" />
                    <div className="h-3 w-32 bg-gray-100/40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Destination breakdown */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 p-5 h-40" />
        </div>
      </div>
    </div>
  )
}
