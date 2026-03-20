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
    type FlightEntry = {
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
    }
    type ApiResponse = {
      data?: FlightEntry[]
      error?: { code: string; message: string }
    }

    const key = apiKey
    const iata = flight

    async function fetchFlights(withDate: boolean): Promise<ApiResponse> {
      const params = new URLSearchParams({
        access_key: key,
        flight_iata: iata,
      })
      if (withDate && date) params.set('flight_date', date)

      const res = await fetch(`http://api.aviationstack.com/v1/flights?${params}`, { next: { revalidate: 3600 } })
      return res.json() as Promise<ApiResponse>
    }

    // Try with date first; if the plan doesn't support it, retry without
    let data = await fetchFlights(!!date)
    if (data.error?.code === 'function_access_restricted' && date) {
      data = await fetchFlights(false)
    }

    if (data.error) {
      console.error('AviationStack API error:', data.error)
      return NextResponse.json({ error: 'AviationStack API error: ' + data.error.message }, { status: 502 })
    }

    const entries = data.data ?? []
    if (entries.length === 0) {
      return NextResponse.json({ error: 'ไม่พบเที่ยวบินนี้', found: false }, { status: 404 })
    }

    // Use the first entry as a template for route info (airline, airports, timezone)
    const f = entries[0]!

    // If user specified a date but API returned a different date (free plan limitation),
    // adjust departure/arrival times to match the requested date while keeping the time-of-day
    let departAt = f.departure.scheduled
    let arriveAt = f.arrival.scheduled

    if (date && f.flight_date !== date) {
      // Extract time portions from the API result
      const departTime = f.departure.scheduled?.split('T')[1] ?? '00:00:00+00:00'
      const arriveTime = f.arrival.scheduled?.split('T')[1] ?? '00:00:00+00:00'

      // Calculate day offset between departure and arrival from API data
      const apiDepartDate = f.departure.scheduled?.split('T')[0] ?? f.flight_date
      const apiArriveDate = f.arrival.scheduled?.split('T')[0] ?? f.flight_date
      const dayOffset = apiArriveDate && apiDepartDate
        ? Math.round((new Date(apiArriveDate).getTime() - new Date(apiDepartDate).getTime()) / 86400000)
        : 0

      // Apply the user's requested date with the same time-of-day
      departAt = `${date}T${departTime}`
      const arriveDate = new Date(date)
      arriveDate.setDate(arriveDate.getDate() + dayOffset)
      const arriveDateStr = arriveDate.toISOString().split('T')[0]
      arriveAt = `${arriveDateStr}T${arriveTime}`
    }

    return NextResponse.json({
      found: true,
      flightNo: f.flight.iata,
      airline: f.airline.name,
      airlineIata: f.airline.iata,
      fromAirport: f.departure.airport,
      fromIata: f.departure.iata,
      toAirport: f.arrival.airport,
      toIata: f.arrival.iata,
      departAt,
      arriveAt,
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
