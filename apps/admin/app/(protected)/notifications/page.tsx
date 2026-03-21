import { db } from '@tripflow/database'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Activity Log — TripFlow Admin' }

const actionIcons: Record<string, { icon: string; color: string }> = {
  'tour.create':       { icon: '🗺️', color: 'bg-indigo-100 text-indigo-600' },
  'tour.update':       { icon: '✏️', color: 'bg-blue-100 text-blue-600' },
  'tour.delete':       { icon: '🗑️', color: 'bg-red-100 text-red-600' },
  'tour.publish':      { icon: '📢', color: 'bg-green-100 text-green-600' },
  'flight.add':        { icon: '✈️', color: 'bg-sky-100 text-sky-600' },
  'flight.update':     { icon: '✈️', color: 'bg-sky-100 text-sky-600' },
  'flight.delete':     { icon: '✈️', color: 'bg-red-100 text-red-600' },
  'member.add':        { icon: '👤', color: 'bg-emerald-100 text-emerald-600' },
  'member.remove':     { icon: '👤', color: 'bg-red-100 text-red-600' },
  'document.add':      { icon: '📄', color: 'bg-amber-100 text-amber-600' },
  'document.update':   { icon: '📄', color: 'bg-amber-100 text-amber-600' },
  'document.delete':   { icon: '📄', color: 'bg-red-100 text-red-600' },
  'checklist.add':     { icon: '✅', color: 'bg-green-100 text-green-600' },
  'checklist.check':   { icon: '☑️', color: 'bg-green-100 text-green-600' },
  'contact.add':       { icon: '📞', color: 'bg-violet-100 text-violet-600' },
  'accommodation.set': { icon: '🏨', color: 'bg-violet-100 text-violet-600' },
  'expense.add':       { icon: '💰', color: 'bg-orange-100 text-orange-600' },
  'user.login':        { icon: '🔑', color: 'bg-gray-100 text-gray-600' },
  'user.register':     { icon: '🆕', color: 'bg-emerald-100 text-emerald-600' },
  'status.change':     { icon: '🔄', color: 'bg-blue-100 text-blue-600' },
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function NotificationsPage() {
  let logs: Array<{
    id: string; action: string; entity: string; entityId: string | null
    description: string; actorName: string | null; actorId: string | null; tourId: string | null
    createdAt: Date
  }> = []

  try {
    logs = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  } catch {
    // Table might not exist yet — show empty
  }

  // Fetch tour titles for display
  const tourIds = [...new Set(logs.map(l => l.tourId).filter(Boolean))] as string[]
  const tours = tourIds.length > 0 ? await db.tour.findMany({
    where: { id: { in: tourIds } },
    select: { id: true, title: true },
  }) : []
  const tourMap = Object.fromEntries(tours.map(t => [t.id, t.title]))

  // Group by date
  const grouped = new Map<string, typeof logs>()
  for (const log of logs) {
    const dateKey = new Date(log.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    const arr = grouped.get(dateKey) ?? []
    arr.push(log)
    grouped.set(dateKey, arr)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-400 text-sm mt-1">ประวัติการเปลี่ยนแปลงทั้งหมดในระบบ</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <p className="font-bold text-gray-900">ยังไม่มีประวัติ</p>
          <p className="text-sm text-gray-400 mt-1">กิจกรรมทั้งหมดจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateLabel, dateLogs]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{dateLabel}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-1">
                {dateLogs.map((log) => {
                  const cfg = actionIcons[log.action] ?? { icon: '📌', color: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className={`w-9 h-9 rounded-xl ${cfg.color} flex items-center justify-center flex-shrink-0 text-base`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{log.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {log.actorName && (
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>👤</span> {log.actorName}
                            </span>
                          )}
                          {log.tourId && tourMap[log.tourId] && (
                            <a href={`/tours/${log.tourId}`} className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-violet-100 transition-colors">
                              <span>🗺️</span> {tourMap[log.tourId]}
                            </a>
                          )}
                          <span className="text-[10px] text-gray-300">{log.action}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-300 flex-shrink-0 mt-1 group-hover:text-gray-400 transition-colors">
                        {getTimeAgo(new Date(log.createdAt))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
