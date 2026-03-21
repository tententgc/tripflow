import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await req.json() as Record<string, unknown>

    const item = await db.checklistItem.update({
      where: { id: itemId },
      data: body,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('ChecklistItem PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

    await db.checklistCheck.deleteMany({ where: { itemId } })
    await db.checklistItem.delete({ where: { id: itemId } })

    logActivity({ action: 'checklist.delete', entity: 'ChecklistItem', entityId: itemId, description: 'ลบรายการเช็คลิสต์' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ChecklistItem DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
