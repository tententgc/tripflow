import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { checklistId } = await params
    const body = await req.json() as {
      label: string
      labelEn?: string
      isImportant?: boolean
    }

    const count = await db.checklistItem.count({ where: { checklistId } })

    const item = await db.checklistItem.create({
      data: {
        checklistId,
        label: body.label,
        labelEn: body.labelEn || null,
        isImportant: body.isImportant ?? false,
        order: count,
      },
    })

    logActivity({ action: 'checklist.add', entity: 'ChecklistItem', entityId: item.id, description: `เพิ่มรายการเช็คลิสต์ "${item.label}"` }).catch(() => {})

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('ChecklistItem POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
