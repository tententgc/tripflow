export default function TravelersLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-32 bg-gray-200/60 rounded-lg" />
        <div className="h-4 w-40 bg-gray-100/60 rounded-lg mt-2" />
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="h-10 flex-1 bg-white/80 backdrop-blur-xl rounded-xl border border-indigo-100/40" />
        <div className="h-10 w-32 bg-white/80 backdrop-blur-xl rounded-xl border border-indigo-100/40" />
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100/40 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-indigo-100/30 px-5 py-3 flex items-center gap-4">
          <div className="h-4 w-8 bg-gray-100/60 rounded" />
          <div className="h-4 w-24 bg-gray-100/60 rounded" />
          <div className="h-4 w-32 bg-gray-100/60 rounded hidden sm:block" />
          <div className="h-4 w-20 bg-gray-100/60 rounded hidden md:block" />
          <div className="h-4 w-24 bg-gray-100/60 rounded hidden lg:block" />
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="border-b border-indigo-50/30 last:border-0 px-5 py-4 flex items-center gap-4"
          >
            <div className="h-9 w-9 bg-gray-100/60 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-4 w-28 bg-gray-100/60 rounded" />
              <div className="h-3 w-40 bg-gray-100/40 rounded" />
            </div>
            <div className="h-3.5 w-24 bg-gray-100/40 rounded hidden sm:block" />
            <div className="hidden md:flex gap-1.5">
              <div className="h-6 w-14 bg-gray-100/40 rounded-full" />
              <div className="h-6 w-14 bg-gray-100/40 rounded-full" />
            </div>
            <div className="h-8 w-8 bg-gray-100/40 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
