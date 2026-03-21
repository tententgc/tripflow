import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; flightId: string }> }
) {
  try {
    const { flightId } = await params
    const body = await req.json() as {
      flightNo?: string
      airline?: string
      airlineIata?: string | null
      fromAirport?: string
      fromIata?: string
      toAirport?: string
      toIata?: string
      departAt?: string
      arriveAt?: string
      departTz?: string
      arriveTz?: string
      terminal?: string | null
      gate?: string | null
    }

    const flight = await db.flightInfo.update({
      where: { id: flightId },
      data: {
        ...(body.flightNo !== undefined && { flightNo: body.flightNo }),
        ...(body.airline !== undefined && { airline: body.airline }),
        ...(body.airlineIata !== undefined && { airlineIata: body.airlineIata }),
        ...(body.fromAirport !== undefined && { fromAirport: body.fromAirport }),
        ...(body.fromIata !== undefined && { fromIata: body.fromIata }),
        ...(body.toAirport !== undefined && { toAirport: body.toAirport }),
        ...(body.toIata !== undefined && { toIata: body.toIata }),
        ...(body.departAt !== undefined && { departAt: new Date(body.departAt) }),
        ...(body.arriveAt !== undefined && { arriveAt: new Date(body.arriveAt) }),
        ...(body.departTz !== undefined && { departTz: body.departTz }),
        ...(body.arriveTz !== undefined && { arriveTz: body.arriveTz }),
        ...(body.terminal !== undefined && { terminal: body.terminal }),
        ...(body.gate !== undefined && { gate: body.gate }),
      },
    })

    logActivity({ actorName: 'Admin', action: 'flight.update', entity: 'Flight', entityId: flightId, description: 'แก้ไขเที่ยวบิน' }).catch(() => {})

    return NextResponse.json(flight)
  } catch (error) {
    console.error('Flight PATCH error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; flightId: string }> }
) {
  try {
    const { flightId } = await params
    await db.flightInfo.delete({ where: { id: flightId } })

    logActivity({
      action: 'flight.delete',
      entity: 'Flight',
      entityId: flightId,
      description: `ลบเที่ยวบิน`,
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Flight DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
