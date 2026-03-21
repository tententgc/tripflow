import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { docId } = await params

    // Only allow deleting own personal documents
    const doc = await db.tourDocument.findUnique({ where: { id: docId } })
    if (!doc || doc.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.tourDocument.delete({ where: { id: docId } })

    logActivity({ action: 'document.delete', entity: 'Document', entityId: docId, description: 'ลบเอกสารส่วนตัว' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
