import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const checklists = await db.checklist.findMany({
      where: { tourId: id },
      include: {
        items: {
          include: { checks: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(checklists)
  } catch (error) {
    console.error('Checklist GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  try {
    const { itemId, userId, checked } = await req.json() as {
      itemId: string
      userId: string
      checked: boolean
    }

    if (checked) {
      await db.checklistCheck.upsert({
        where: { itemId_userId: { itemId, userId } },
        create: { itemId, userId },
        update: { checkedAt: new Date() },
      })
    } else {
      await db.checklistCheck.deleteMany({
        where: { itemId, userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Checklist POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
