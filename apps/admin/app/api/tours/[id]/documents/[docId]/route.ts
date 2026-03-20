import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { docId } = await params
    const body = await req.json() as Record<string, unknown>

    const doc = await db.tourDocument.update({
      where: { id: docId },
      data: body,
    })

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
    const { docId } = await params
    await db.tourDocument.delete({ where: { id: docId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
