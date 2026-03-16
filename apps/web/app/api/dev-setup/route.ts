import { NextRequest, NextResponse } from 'next/server'
import { db } from '@tripflow/database'
import { createClient } from '@/lib/supabase/server'

// Development-only endpoint to add current user to all tours
export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Find or create DB user
  let dbUser = await db.user.findUnique({ where: { email: user.email! } })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    })
  }

  // Add to all existing tours
  const tours = await db.tour.findMany({ select: { id: true, title: true } })
  const added = []
  for (const tour of tours) {
    await db.tourMember.upsert({
      where: { tourId_userId: { tourId: tour.id, userId: dbUser.id } },
      create: { tourId: tour.id, userId: dbUser.id, role: 'LEADER' },
      update: {},
    })
    added.push(tour.title)
  }

  return NextResponse.json({ user: dbUser.name, addedToTours: added })
}
