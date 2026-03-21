export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-56 bg-gray-100 rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 rounded-2xl h-28" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-80" />
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 h-48" />
          <div className="bg-white rounded-2xl border border-gray-100 h-40" />
        </div>
      </div>
    </div>
  )
}
