import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'

// GET all travelers (users) with their tour memberships
export async function GET() {
  try {
    const users = await db.user.findMany({
      include: {
        tourMembers: {
          include: {
            tour: {
              select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('GET travelers error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

// POST create new traveler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name: string; email: string; phone?: string; nameEn?: string }

    if (!body.email || !body.name) {
      return NextResponse.json({ error: 'ต้องระบุชื่อและอีเมล' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้มีในระบบแล้ว' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        email: body.email,
        name: body.name,
        ...(body.nameEn != null && { nameEn: body.nameEn }),
        ...(body.phone != null && { phone: body.phone }),
      },
      include: {
        tourMembers: { include: { tour: { select: { id: true, title: true, startDate: true, endDate: true, primaryCountry: true, isChina: true, status: true } } } },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST traveler error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
