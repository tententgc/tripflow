import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { dayId } = await params
    const body = await req.json() as {
      name: string
      nameLocal?: string
      address?: string
      addressLocal?: string
      phone?: string
      phoneLocal?: string
      checkIn?: string
      checkOut?: string
      confirmationNo?: string
      wifiName?: string
      wifiPassword?: string
      roomType?: string
      imageUrl?: string
      notes?: string
    }

    const accommodation = await db.accommodation.upsert({
      where: { tourDayId: dayId },
      create: {
        tourDayId: dayId,
        name: body.name,
        nameLocal: body.nameLocal || null,
        address: body.address || null,
        addressLocal: body.addressLocal || null,
        phone: body.phone || null,
        phoneLocal: body.phoneLocal || null,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        confirmationNo: body.confirmationNo || null,
        wifiName: body.wifiName || null,
        wifiPassword: body.wifiPassword || null,
        roomType: body.roomType || null,
        imageUrl: body.imageUrl || null,
        notes: body.notes || null,
      },
      update: {
        name: body.name,
        nameLocal: body.nameLocal || null,
        address: body.address || null,
        addressLocal: body.addressLocal || null,
        phone: body.phone || null,
        phoneLocal: body.phoneLocal || null,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        confirmationNo: body.confirmationNo || null,
        wifiName: body.wifiName || null,
        wifiPassword: body.wifiPassword || null,
        roomType: body.roomType || null,
        imageUrl: body.imageUrl || null,
        notes: body.notes || null,
      },
    })

    logActivity({
      action: 'accommodation.set',
      entity: 'Accommodation',
      entityId: accommodation.id,
      description: `ตั้งค่าที่พัก "${accommodation.name}"`,
    }).catch(() => {})

    return NextResponse.json(accommodation)
  } catch (error) {
    console.error('Accommodation PUT error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; dayId: string }> }
) {
  try {
    const { dayId } = await params
    await db.accommodation.delete({ where: { tourDayId: dayId } })

    logActivity({ actorName: 'Admin', action: 'accommodation.delete', entity: 'Accommodation', description: 'ลบที่พัก' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accommodation DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
