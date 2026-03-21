import { NextRequest, NextResponse } from 'next/server'
import { createAIAdapter, buildTravelSystemPrompt } from '@tripflow/adapters'
import { getTourRegion } from '@tripflow/utils'
import { db } from '@tripflow/database'
import { getCached, setCache } from '@/lib/cache'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { messages } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    // Fetch tour data to build context (cached 5 min — chat context rarely changes)
    const cacheKey = 'chat-tour:' + id
    let tour = getCached<Awaited<ReturnType<typeof fetchChatTour>>>(cacheKey)
    if (!tour) {
      tour = await fetchChatTour(id)
      if (tour) setCache(cacheKey, tour, 300_000)
    }

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    const region = getTourRegion(tour.countries)
    const adapter = createAIAdapter(region)

    // Find today's day
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentDay = tour.days.find(d => {
      const dd = new Date(d.date)
      dd.setHours(0, 0, 0, 0)
      return dd.getTime() === today.getTime()
    }) ?? tour.days[0]

    const localTime = new Date().toLocaleTimeString('th-TH', {
      timeZone: currentDay?.timezone ?? tour.timezone,
      hour: '2-digit', minute: '2-digit',
    })

    const todayActivities = currentDay
      ? currentDay.activities.map(a => `${a.time ?? ''} ${a.title}`).join(', ') || 'ไม่มีกิจกรรม'
      : 'ไม่มีข้อมูล'

    const emergencyNumbers = tour.isChina
      ? 'ตำรวจ 110, รถพยาบาล 120, ไฟไหม้ 119, ท่องเที่ยว 12301'
      : 'ตำรวจ 191, รถพยาบาล 1669, ไฟไหม้ 199'

    const systemPrompt = buildTravelSystemPrompt({
      tourTitle: tour.title,
      dayNumber: currentDay?.dayNumber ?? 1,
      city: currentDay?.city ?? tour.cities[0] ?? '',
      country: currentDay?.country ?? tour.primaryCountry,
      timezone: currentDay?.timezone ?? tour.timezone,
      localTime,
      todayActivities,
      ...(currentDay?.accommodation?.name ? { accommodationName: currentDay.accommodation.name } : {}),
      weatherSummary: 'ไม่มีข้อมูลสภาพอากาศ',
      memberCount: tour._count.members,
      ...(tour.destCurrency ? { destCurrency: tour.destCurrency } : {}),
      emergency: emergencyNumbers,
    })

    const stream = await adapter.streamChat(messages, systemPrompt, region)

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

/** Fetch only the fields the system prompt needs (select instead of include) */
function fetchChatTour(id: string) {
  return db.tour.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      countries: true,
      primaryCountry: true,
      isChina: true,
      timezone: true,
      destCurrency: true,
      currency: true,
      cities: true,
      days: {
        orderBy: { dayNumber: 'asc' },
        select: {
          dayNumber: true,
          date: true,
          timezone: true,
          city: true,
          country: true,
          title: true,
          mealBreakfast: true,
          mealLunch: true,
          mealDinner: true,
          activities: {
            orderBy: { order: 'asc' },
            select: { time: true, title: true, titleLocal: true, locationName: true, category: true, order: true },
          },
          accommodation: {
            select: { name: true, nameLocal: true, wifiName: true, phone: true },
          },
        },
      },
      _count: { select: { members: true } },
      emergencyInfo: {
        select: { emergencyNumbers: true, embassyContacts: true, thaiEmbassyPhone: true },
      },
      contacts: {
        select: { name: true, phone: true, type: true },
      },
    },
  })
}
