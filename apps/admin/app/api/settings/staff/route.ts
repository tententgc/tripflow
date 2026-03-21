import { NextRequest, NextResponse } from 'next/server'
import { db, logActivity } from '@tripflow/database'

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json() as { email: string; role?: string }

    if (!email?.trim()) return NextResponse.json({ error: 'กรุณาระบุอีเมล' }, { status: 400 })

    const operator = await db.operator.findFirst()
    if (!operator) return NextResponse.json({ error: 'Operator not found' }, { status: 404 })

    // Find or create user
    let user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!user) {
      user = await db.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: email.split('@')[0] ?? 'Admin',
          systemRole: 'SUPER_ADMIN',
        },
      })
    } else {
      await db.user.update({ where: { id: user.id }, data: { systemRole: 'SUPER_ADMIN' } })
    }

    // Check if already staff
    const existing = await db.operatorStaff.findUnique({
      where: { operatorId_userId: { operatorId: operator.id, userId: user.id } },
    })
    if (existing) return NextResponse.json({ error: 'อีเมลนี้เป็นผู้ดูแลอยู่แล้ว' }, { status: 409 })

    const staff = await db.operatorStaff.create({
      data: {
        operatorId: operator.id,
        userId: user.id,
        role: (role as 'STAFF') ?? 'STAFF',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    logActivity({ actorName: 'Admin', action: 'staff.add', entity: 'OperatorStaff', description: `เพิ่มผู้ดูแล "${user.email}"` }).catch(() => {})

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Staff POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { staffId } = await req.json() as { staffId: string }

    await db.operatorStaff.delete({ where: { id: staffId } })

    logActivity({ actorName: 'Admin', action: 'staff.remove', entity: 'OperatorStaff', description: 'นำผู้ดูแลออก' }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Staff DELETE error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
