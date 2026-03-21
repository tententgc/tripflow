import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { id } = await params

    // Get dbUser to filter personal docs
    let dbUserId: string | null = null
    if (user?.email) {
      const dbUser = await db.user.findUnique({ where: { email: user.email } })
      dbUserId = dbUser?.id ?? null
    }

    // Return: group docs + only this user's personal docs
    const documents = await db.tourDocument.findMany({
      where: {
        tourId: id,
        OR: [
          { isPersonal: false },
          ...(dbUserId ? [{ isPersonal: true, userId: dbUserId }] : []),
        ],
      },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Lookup DB user by email
    const dbUser = await db.user.findUnique({ where: { email: user.email! } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id } = await params
    const body = await req.json() as {
      title: string
      titleEn?: string
      type: string
      fileUrl?: string
      qrData?: string
      description?: string
    }

    const doc = await db.tourDocument.create({
      data: {
        tourId: id,
        title: body.title,
        titleEn: body.titleEn || null,
        type: body.type as 'OTHER',
        fileUrl: body.fileUrl || null,
        qrData: body.qrData || null,
        description: body.description || null,
        isPersonal: true,
        userId: dbUser.id,
      },
    })

    logActivity({
      action: 'document.add',
      entity: 'Document',
      entityId: doc.id,
      description: `อัพโหลดเอกสาร "${doc.title}" (ส่วนตัว)`,
      actorId: dbUser.id,
      actorName: dbUser.name,
      tourId: id,
    }).catch(() => {})

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Document POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
