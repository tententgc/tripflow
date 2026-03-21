import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json() as { email?: string; userId?: string }

    let user
    if (body.userId) {
      user = await db.user.findUnique({ where: { id: body.userId } })
      if (!user) return NextResponse.json({ error: 'ไม่พบผู้ใช้นี้' }, { status: 404 })
    } else if (body.email) {
      user = await db.user.findUnique({ where: { email: body.email } })
      if (!user) {
        user = await db.user.create({
          data: { email: body.email, name: body.email.split('@')[0] ?? body.email },
        })
      }
    } else {
      return NextResponse.json({ error: 'ต้องระบุ userId หรือ email' }, { status: 400 })
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

    logActivity({
      action: 'member.add',
      entity: 'TourMember',
      entityId: member.id,
      description: `เพิ่มสมาชิกเข้าทัวร์`,
      tourId: id,
    }).catch(() => {})

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

    logActivity({
      action: 'member.remove',
      entity: 'TourMember',
      description: `นำสมาชิกออกจากทัวร์`,
      tourId: id,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Member DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
