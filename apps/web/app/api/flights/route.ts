import { NextRequest, NextResponse } from 'next/server'
import { createFlightAdapter } from '@tripflow/adapters'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const flightNo = searchParams.get('flightNo')
  const date = searchParams.get('date')
  const airlineIata = searchParams.get('airlineIata') ?? undefined

  if (!flightNo || !date) {
    return NextResponse.json({ error: 'flightNo and date are required' }, { status: 400 })
  }

  try {
    const adapter = createFlightAdapter()
    const status = await adapter.getStatus(flightNo, date, airlineIata)
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Flight API error:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลเที่ยวบินได้' }, { status: 500 })
  }
}
