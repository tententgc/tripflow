import { NextRequest, NextResponse } from 'next/server'
import { createMapsAdapter } from '@tripflow/adapters'
import type { TourRegion } from '@tripflow/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('keyword')
  const lat = parseFloat(searchParams.get('lat') ?? '0')
  const lon = parseFloat(searchParams.get('lon') ?? '0')
  const region = (searchParams.get('region') ?? 'GLOBAL') as TourRegion

  if (!keyword) {
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
  }

  try {
    const adapter = createMapsAdapter(region)
    const results = await adapter.searchNearby(keyword, lat, lon, region)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Maps search error:', error)
    return NextResponse.json({ error: 'ไม่สามารถค้นหาได้' }, { status: 500 })
  }
}
