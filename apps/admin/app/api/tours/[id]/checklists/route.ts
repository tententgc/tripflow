import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const checklists = await db.checklist.findMany({
      where: { tourId: id },
      select: {
        id: true,
        tourId: true,
        title: true,
        titleEn: true,
        emoji: true,
        type: true,
        order: true,
        items: {
          select: { id: true, checklistId: true, label: true, labelEn: true, order: true, isImportant: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
    const res = NextResponse.json(checklists)
    res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
    return res
  } catch (error) {
    console.error('Checklists GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      title: string
      titleEn?: string
      emoji?: string
      type?: string
    }

    const count = await db.checklist.count({ where: { tourId: id } })

    const checklist = await db.checklist.create({
      data: {
        tourId: id,
        title: body.title,
        titleEn: body.titleEn || null,
        emoji: body.emoji || null,
        type: (body.type as 'GENERAL') || 'GENERAL',
        order: count,
      },
      include: { items: true },
    })

    logActivity({ actorName: 'Admin', action: 'checklist.add', entity: 'Checklist', entityId: checklist.id, description: `สร้างเช็คลิสต์ "${checklist.title}"`, tourId: id }).catch(() => {})

    return NextResponse.json(checklist, { status: 201 })
  } catch (error) {
    console.error('Checklist POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
