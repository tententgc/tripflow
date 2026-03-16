import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [emergency, tour] = await Promise.all([
      db.emergencyInfo.findUnique({
        where: { tourId: id },
      }),
      db.tour.findUnique({
        where: { id },
        select: { isChina: true, countries: true },
      }),
    ])

    return NextResponse.json({ emergency, isChina: tour?.isChina ?? false })
  } catch (error) {
    console.error('Emergency GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
