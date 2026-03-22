import { revalidateWebCache } from '@/lib/revalidate-web'
import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    const body = await req.json() as Record<string, unknown>

    const doc = await db.tourDocument.update({
      where: { id: docId },
      data: body,
    })

    logActivity({ actorName: 'Admin', action: 'document.update', entity: 'Document', entityId: docId, tourId: id, description: 'แก้ไขเอกสาร' }).catch(() => {})

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Document PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    await db.tourDocument.delete({ where: { id: docId } })

    logActivity({
      action: 'document.delete',
      entity: 'Document',
      entityId: docId,
      tourId: id,
      description: `ลบเอกสาร`,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
