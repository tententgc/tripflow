import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email } = await req.json() as { email: string }

    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: email.split('@')[0] ?? email,
        },
      })
    }

    const member = await db.tourMember.upsert({
      where: { tourId_userId: { tourId: id, userId: user.id } },
      create: { tourId: id, userId: user.id, role: 'MEMBER' },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            passportExpiry: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Member POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await req.json() as { userId: string }
    await db.tourMember.delete({
      where: { tourId_userId: { tourId: id, userId } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Member DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
