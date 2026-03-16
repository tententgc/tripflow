import { NextRequest, NextResponse } from 'next/server'
import { createAIAdapter, buildTravelSystemPrompt } from '@tripflow/adapters'
import { getTourRegion } from '@tripflow/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { messages, tourContext } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      tourContext: {
        tourTitle: string
        countries: string[]
        dayNumber: number
        city: string
        country: string
        timezone: string
        localTime: string
        todayActivities: string
        accommodationName?: string
        weatherSummary: string
        memberCount: number
        exchangeRate?: string
        destCurrency?: string
        emergency: string
      }
    }

    const region = getTourRegion(tourContext.countries)
    const adapter = createAIAdapter(region)

    const systemPrompt = buildTravelSystemPrompt(tourContext)

    // Stream response as SSE
    const stream = await adapter.streamChat(messages, systemPrompt, region)

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const data = `data: ${JSON.stringify({ text: value })}\n\n`
            controller.enqueue(encoder.encode(data))
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
