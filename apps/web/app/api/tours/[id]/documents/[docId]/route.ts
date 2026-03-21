import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { getAuthUserLight } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    // Parallelize params resolution + auth
    const [{ id, docId }, dbUser] = await Promise.all([
      params,
      getAuthUserLight(),
    ])

    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only allow deleting own personal documents
    const doc = await db.tourDocument.findUnique({
      where: { id: docId },
      select: { id: true, userId: true },
    })
    if (!doc || doc.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.tourDocument.delete({ where: { id: docId } })

    logActivity({ action: 'document.delete', entity: 'Document', entityId: docId, tourId: id, actorName: dbUser.name, description: 'ลบเอกสารส่วนตัว' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
