import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documents = await db.tourDocument.findMany({
      where: { tourId: id },
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

    const { id } = await params
    const body = await req.json() as {
      title: string
      titleEn?: string
      type: string
      fileUrl?: string
      qrData?: string
      description?: string
    }

    // User-uploaded documents are always personal
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
        userId: user.id,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Document POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
