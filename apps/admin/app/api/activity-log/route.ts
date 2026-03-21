import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const tourId = searchParams.get('tourId')

    const logs = await db.activityLog.findMany({
      ...(tourId ? { where: { tourId } } : {}),
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('ActivityLog GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action: string
      entity: string
      entityId?: string
      description: string
      actorId?: string
      actorName?: string
      tourId?: string
      metadata?: Record<string, unknown>
    }

    const log = await db.activityLog.create({
      data: {
        action: body.action,
        entity: body.entity,
        entityId: body.entityId ?? null,
        description: body.description,
        actorId: body.actorId ?? null,
        actorName: body.actorName ?? null,
        tourId: body.tourId ?? null,
        metadata: body.metadata as object ?? undefined,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('ActivityLog POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
