import { revalidateWebCache } from '@/lib/revalidate-web'
import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tourId } = await params
    const body = await req.json() as {
      flightNo: string
      airline: string
      airlineIata?: string | null
      fromAirport: string
      fromIata: string
      toAirport: string
      toIata: string
      departAt: string
      arriveAt: string
      departTz: string
      arriveTz: string
      terminal?: string | null
      gate?: string | null
    }

    const flight = await db.flightInfo.create({
      data: {
        tourId,
        flightNo: body.flightNo,
        airline: body.airline,
        airlineIata: body.airlineIata ?? null,
        fromAirport: body.fromAirport,
        fromIata: body.fromIata,
        toAirport: body.toAirport,
        toIata: body.toIata,
        departAt: new Date(body.departAt),
        arriveAt: new Date(body.arriveAt),
        departTz: body.departTz,
        arriveTz: body.arriveTz,
        terminal: body.terminal ?? null,
        gate: body.gate ?? null,
      },
    })

    logActivity({
      action: 'flight.add',
      entity: 'Flight',
      entityId: flight.id,
      description: `เพิ่มเที่ยวบิน ${flight.flightNo}`,
      tourId,
    }).catch(() => {})

    return NextResponse.json(flight, { status: 201 })
  } catch (error) {
    console.error('Flight POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
