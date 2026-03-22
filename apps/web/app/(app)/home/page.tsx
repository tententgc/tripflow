import { createClient } from '@/lib/supabase/server'
import { db } from '@tripflow/database'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = { title: 'ทริปของฉัน — TripFlow' }
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const w = console.warn; console.warn = () => {}
  const { data: { session } } = await supabase.auth.getSession()
  console.warn = w
  const user = session?.user
  if (!user) redirect('/login')

  let dbUser = await db.user.findUnique({
    where: { email: user.email! },
    select: { id: true, name: true, email: true, avatarUrl: true },
  })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split('@')[0] ?? 'ผู้ใช้',
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
  }

  const tourMembers = await db.tourMember.findMany({
    where: {
      userId: dbUser.id,
      tour: { status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] } },
    },
    select: {
      tour: {
        select: {
          id: true, title: true, coverImageUrl: true, countries: true,
          primaryCountry: true, cities: true, startDate: true, endDate: true,
          isChina: true, status: true,
          _count: { select: { members: true } },
          days: { select: { id: true } },
        },
      },
    },
    orderBy: { tour: { startDate: 'asc' } },
    take: 50,
  })

  const tours = tourMembers.map(tm => tm.tour)

  // Pass server data as initial data — HomeClient uses SWR to auto-refresh every 15s
  return (
    <HomeClient
      initialData={{
        tours: tours.map(t => ({
          ...t,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
        })),
        user: { id: dbUser.id, name: dbUser.name, avatarUrl: dbUser.avatarUrl },
      }}
    />
  )
}
