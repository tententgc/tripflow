import { NextRequest, NextResponse } from 'next/server'
import { createAIAdapter, buildTravelSystemPrompt } from '@tripflow/adapters'
import { getTourRegion } from '@tripflow/utils'
import { db } from '@tripflow/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { messages } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    // Fetch tour data to build context
    const tour = await db.tour.findUnique({
      where: { id },
      include: {
        days: {
          include: { activities: { orderBy: { order: 'asc' } }, accommodation: true },
          orderBy: { dayNumber: 'asc' },
        },
        members: true,
        emergencyInfo: true,
      },
    })

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
      accommodationName: currentDay?.accommodation?.name,
      weatherSummary: 'ไม่มีข้อมูลสภาพอากาศ',
      memberCount: tour.members.length,
      destCurrency: tour.destCurrency ?? undefined,
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
