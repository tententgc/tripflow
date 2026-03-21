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
    await db.activityLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        description: params.description,
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
