import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const base = searchParams.get('base') ?? 'USD'

  try {
    const apiKey = process.env['EXCHANGE_RATE_API_KEY']
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`

    const res = await fetch(url)
    if (!res.ok) throw new Error('Exchange rate API error')

    const data = await res.json() as { conversion_rates: Record<string, number> }

    return NextResponse.json(
      { base, rates: data.conversion_rates, lastUpdated: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Currency API error:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
