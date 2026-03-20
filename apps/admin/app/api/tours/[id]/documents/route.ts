import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

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
    const { id } = await params
    const body = await req.json() as {
      title: string
      titleEn?: string
      type: string
      fileUrl?: string
      qrData?: string
      description?: string
      isPersonal?: boolean
      userId?: string
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
        isPersonal: body.isPersonal ?? false,
        userId: body.userId || null,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Document POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
