import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const body = await req.json() as Record<string, unknown>

    const checklist = await db.checklist.update({
      where: { id: checklistId },
      data: body,
      include: { items: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(checklist)
  } catch (error) {
    console.error('Checklist PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params

    // Delete items first, then checklist
    await db.checklistItem.deleteMany({ where: { checklistId } })
    await db.checklist.delete({ where: { id: checklistId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Checklist DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
