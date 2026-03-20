import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

// PATCH update traveler info
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const body = await req.json() as { name?: string; nameEn?: string; phone?: string }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.nameEn != null && { nameEn: body.nameEn }),
        ...(body.phone != null && { phone: body.phone }),
      },
      include: {
        tourMembers: { include: { tour: { select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true } } } },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('PATCH traveler error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// DELETE remove traveler (and all tour memberships)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Remove from all tours first (FK constraint)
    await db.tourMember.deleteMany({ where: { userId } })
    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE traveler error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
