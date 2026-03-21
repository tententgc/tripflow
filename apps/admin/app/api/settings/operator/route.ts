import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>

    const operator = await db.operator.findFirst()
    if (!operator) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

    const updated = await db.operator.update({
      where: { id: operator.id },
      data: body,
    })

    logActivity({ actorName: 'Admin', action: 'settings.update', entity: 'Operator', entityId: updated.id, description: `แก้ไขข้อมูลบริษัท "${updated.name}"` }).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Operator PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
