import { NextRequest, NextResponse } from 'next/server'

// Lookup flight info from AviationStack API
// Usage: GET /api/flights/lookup?flight=TG676&date=2026-04-18
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const flight = searchParams.get('flight')?.trim().toUpperCase()
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!flight) return NextResponse.json({ error: 'flight param required' }, { status: 400 })

  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AVIATIONSTACK_API_KEY not configured' }, { status: 500 })
  }

  try {
    const params = new URLSearchParams({
      access_key: apiKey,
      flight_iata: flight,
    })
    if (date) params.set('flight_date', date)

    const res = await fetch(`http://api.aviationstack.com/v1/flights?${params}`, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'AviationStack API error' }, { status: 502 })
    }

    const data = await res.json() as {
      data?: Array<{
        flight_date: string
        flight: { iata: string; number: string }
        airline: { name: string; iata: string }
        departure: {
          airport: string
          iata: string
          timezone: string
          scheduled: string
          terminal: string | null
          gate: string | null
        }
        arrival: {
          airport: string
          iata: string
          timezone: string
          scheduled: string
          terminal: string | null
          gate: string | null
        }
      }>
    }

    if (!data.data?.length) {
      return NextResponse.json({ error: 'ไม่พบเที่ยวบินนี้', found: false }, { status: 404 })
    }

    const f = data.data[0]
    return NextResponse.json({
      found: true,
      flightNo: f.flight.iata,
      airline: f.airline.name,
      airlineIata: f.airline.iata,
      fromAirport: f.departure.airport,
      fromIata: f.departure.iata,
      toAirport: f.arrival.airport,
      toIata: f.arrival.iata,
      departAt: f.departure.scheduled,
      arriveAt: f.arrival.scheduled,
      departTz: f.departure.timezone,
      arriveTz: f.arrival.timezone,
      terminal: f.departure.terminal,
      gate: f.departure.gate,
    })
  } catch (err) {
    console.error('Flight lookup error:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
