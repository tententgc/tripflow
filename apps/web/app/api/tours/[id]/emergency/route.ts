import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [emergency, tour] = await Promise.all([
      db.emergencyInfo.findUnique({
        where: { tourId: params.id },
      }),
      db.tour.findUnique({
        where: { id: params.id },
        select: { isChina: true, countries: true },
      }),
    ])

    return NextResponse.json({ emergency, isChina: tour?.isChina ?? false })
  } catch (error) {
    console.error('Emergency GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
