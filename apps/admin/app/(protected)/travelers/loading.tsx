export default function TravelersLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 w-40 bg-indigo-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-32" />
        ))}
      </div>
    </div>
  )
}
