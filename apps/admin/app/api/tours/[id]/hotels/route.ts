import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'
import { revalidateWebCache } from '@/lib/revalidate-web'

/**
 * GET /api/tours/[id]/hotels
 * Returns unique hotels for a tour (grouped by name from accommodation records)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const days = await db.tourDay.findMany({
      where: { tourId: id },
      include: { accommodation: true },
      orderBy: { dayNumber: 'asc' },
    })

    // Group accommodations by hotel name to find unique hotels
    const hotelMap = new Map<string, {
      name: string
      nameLocal: string | null
      address: string | null
      addressLocal: string | null
      phone: string | null
      phoneLocal: string | null
      checkIn: string | null
      checkOut: string | null
      checkInDate: string | null
      checkOutDate: string | null
      confirmationNo: string | null
      wifiName: string | null
      wifiPassword: string | null
      roomType: string | null
      imageUrl: string | null
      notes: string | null
      dayIds: string[]
      dayNumbers: number[]
    }>()

    for (const day of days) {
      if (!day.accommodation) continue
      const a = day.accommodation
      const key = a.name.trim().toLowerCase()

      if (hotelMap.has(key)) {
        const existing = hotelMap.get(key)!
        existing.dayIds.push(day.id)
        existing.dayNumbers.push(day.dayNumber)
      } else {
        hotelMap.set(key, {
          name: a.name,
          nameLocal: a.nameLocal,
          address: a.address,
          addressLocal: a.addressLocal,
          phone: a.phone,
          phoneLocal: a.phoneLocal,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          checkInDate: a.checkInDate?.toISOString() ?? null,
          checkOutDate: a.checkOutDate?.toISOString() ?? null,
          confirmationNo: a.confirmationNo,
          wifiName: a.wifiName,
          wifiPassword: a.wifiPassword,
          roomType: a.roomType,
          imageUrl: a.imageUrl,
          notes: a.notes,
          dayIds: [day.id],
          dayNumbers: [day.dayNumber],
        })
      }
    }

    const hotels = Array.from(hotelMap.values()).map((h, i) => ({
      id: `hotel-${i}`,
      ...h,
    }))

    return NextResponse.json({ hotels, days: days.map(d => ({ id: d.id, dayNumber: d.dayNumber, date: d.date.toISOString() })) })
  } catch (error) {
    console.error('Hotels GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

/**
 * POST /api/tours/[id]/hotels
 * Creates/updates accommodation records for all days in the check-in to check-out date range
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as {
      name: string
      nameLocal?: string
      address?: string
      addressLocal?: string
      phone?: string
      phoneLocal?: string
      checkIn?: string       // time e.g. "14:00"
      checkOut?: string      // time e.g. "12:00"
      checkInDate: string    // ISO date string
      checkOutDate: string   // ISO date string
      confirmationNo?: string
      wifiName?: string
      wifiPassword?: string
      roomType?: string
      imageUrl?: string
      notes?: string
      // If updating, which hotel name was previously set (to remove old records)
      previousName?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 })
    }
    if (!body.checkInDate || !body.checkOutDate) {
      return NextResponse.json({ error: 'Check-in and check-out dates are required' }, { status: 400 })
    }

    const checkInDate = new Date(body.checkInDate)
    const checkOutDate = new Date(body.checkOutDate)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    // Get all tour days
    const days = await db.tourDay.findMany({
      where: { tourId: id },
      include: { accommodation: true },
      orderBy: { dayNumber: 'asc' },
    })

    // Find days that fall within the stay range
    // Stay nights: check-in date up to (but not including) check-out date
    const matchingDays = days.filter(day => {
      const dayDate = new Date(day.date)
      const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
      const ciStart = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
      const coStart = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate())
      return dayStart >= ciStart && dayStart < coStart
    })

    if (matchingDays.length === 0) {
      return NextResponse.json({ error: 'No tour days match the selected dates' }, { status: 400 })
    }

    // If updating (previousName set), remove old accommodation records for that hotel
    if (body.previousName) {
      const oldDays = days.filter(d =>
        d.accommodation && d.accommodation.name.trim().toLowerCase() === body.previousName!.trim().toLowerCase()
      )
      for (const day of oldDays) {
        // Only delete if this day is NOT in the new matching days
        if (!matchingDays.find(md => md.id === day.id)) {
          await db.accommodation.delete({ where: { tourDayId: day.id } }).catch(() => {})
        }
      }
    }

    // Upsert accommodation for each matching day
    const accomData = {
      name: body.name.trim(),
      nameLocal: body.nameLocal || null,
      address: body.address || null,
      addressLocal: body.addressLocal || null,
      phone: body.phone || null,
      phoneLocal: body.phoneLocal || null,
      checkIn: body.checkIn || null,
      checkOut: body.checkOut || null,
      checkInDate,
      checkOutDate,
      confirmationNo: body.confirmationNo || null,
      wifiName: body.wifiName || null,
      wifiPassword: body.wifiPassword || null,
      roomType: body.roomType || null,
      imageUrl: body.imageUrl || null,
      notes: body.notes || null,
    }

    const results = []
    for (const day of matchingDays) {
      const accommodation = await db.accommodation.upsert({
        where: { tourDayId: day.id },
        create: { tourDayId: day.id, ...accomData },
        update: accomData,
      })
      results.push(accommodation)
    }

    logActivity({
      action: 'hotel.set',
      entity: 'Accommodation',
      entityId: results[0]?.id ?? '',
      tourId: id,
      description: `ตั้งค่าที่พัก "${body.name}" (${matchingDays.length} คืน)`,
    }).catch(() => {})

    revalidateWebCache(id)

    return NextResponse.json({
      hotel: accomData,
      assignedDays: matchingDays.map(d => ({ id: d.id, dayNumber: d.dayNumber })),
      count: results.length,
    })
  } catch (error) {
    console.error('Hotels POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
