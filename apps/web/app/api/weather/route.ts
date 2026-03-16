import { NextRequest, NextResponse } from 'next/server'
import { createWeatherAdapter } from '@tripflow/adapters'
import type { TourRegion } from '@tripflow/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '0')
  const lon = parseFloat(searchParams.get('lon') ?? '0')
  const region = (searchParams.get('region') ?? 'GLOBAL') as TourRegion

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 })
  }

  try {
    const adapter = createWeatherAdapter(region)
    const forecast = await adapter.getForecast(lat, lon, region)
    return NextResponse.json(forecast, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลสภาพอากาศได้' }, { status: 500 })
  }
}
