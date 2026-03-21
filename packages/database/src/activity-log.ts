import { db } from './index'

export async function logActivity(params: {
  action: string
  entity: string
  entityId?: string
  description: string
  actorId?: string
  actorName?: string
  tourId?: string
  metadata?: Record<string, unknown>
}) {
  try {
    let tourTitle: string | undefined
    let enrichedDesc = params.description

    // Auto-fetch tour title if tourId provided
    if (params.tourId) {
      try {
        const tour = await db.tour.findUnique({
          where: { id: params.tourId },
          select: { title: true },
        })
        if (tour) tourTitle = tour.title
      } catch { /* ignore */ }
    }

    // Append tour name to description if not already included
    if (tourTitle && !enrichedDesc.includes(tourTitle)) {
      enrichedDesc = `${enrichedDesc} [${tourTitle}]`
    }

    await db.activityLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        description: enrichedDesc,
        actorId: params.actorId ?? null,
        actorName: params.actorName ?? null,
        tourId: params.tourId ?? null,
        metadata: params.metadata as object ?? undefined,
      },
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}
