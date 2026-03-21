import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { getAuthUser, getAuthUserLight } from '@/lib/auth'

const DOC_SELECT = {
  id: true, title: true, titleEn: true, type: true,
  fileUrl: true, qrData: true, description: true,
  isPersonal: true, userId: true,
} as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parallel: get tour id + auth user + group docs
    const [{ id }, authUser] = await Promise.all([params, getAuthUser()])

    const [groupDocs, personalDocs] = await Promise.all([
      db.tourDocument.findMany({
        where: { tourId: id, isPersonal: false },
        select: DOC_SELECT,
        orderBy: { id: 'asc' },
      }),
      authUser?.id
        ? db.tourDocument.findMany({
            where: { tourId: id, isPersonal: true, userId: authUser.id },
            select: DOC_SELECT,
            orderBy: { id: 'asc' },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json([...groupDocs, ...personalDocs], {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' },
    })
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
    const [{ id }, dbUser, body] = await Promise.all([
      params,
      getAuthUserLight(),
      req.json() as Promise<{
        title: string; titleEn?: string; type: string
        fileUrl?: string; qrData?: string; description?: string
      }>,
    ])
    if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
