import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const phrases = await db.usefulPhrase.findMany({
      where: { tourId: id },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json(phrases)
  } catch (error) {
    console.error('Phrases GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
