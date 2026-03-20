import type { TourRegion, Message } from '@tripflow/types'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export interface AIAdapter {
  streamChat(
    messages: Message[],
    systemPrompt: string,
    region: TourRegion
  ): Promise<ReadableStream<string>>

  chat(
    messages: Message[],
    systemPrompt: string,
    region: TourRegion
  ): Promise<string>
}

/**
 * Claude adapter (Anthropic) — Global tours only
 * claude-sonnet-4-20250514 model
 * NOT accessible inside mainland China
 */
export class ClaudeAdapter implements AIAdapter {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    _region: TourRegion
  ): Promise<ReadableStream<string>> {
    const stream = await this.client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    return new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(chunk.delta.text)
          }
        }
        controller.close()
      },
    })
  }

  async chat(messages: Message[], systemPrompt: string, _region: TourRegion): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') return ''
    return block.text
  }
}

/**
 * Qwen (Alibaba DashScope) adapter — China tours only
 * API: dashscope.aliyuncs.com/compatible-mode/v1
 * Accessible inside mainland China
 * Uses OpenAI-compatible API
 */
export class QwenAdapter implements AIAdapter {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    _region: TourRegion
  ): Promise<ReadableStream<string>> {
    const stream = await this.client.chat.completions.create({
      model: 'qwen-turbo',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })

    return new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) controller.enqueue(text)
        }
        controller.close()
      },
    })
  }

  async chat(messages: Message[], systemPrompt: string, _region: TourRegion): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })

    return response.choices[0]?.message?.content ?? ''
  }
}

/**
 * GPT adapter (OpenAI) — Global tours
 * Uses gpt-4o-mini for cost efficiency, falls back to Claude if no key
 */
export class GPTAdapter implements AIAdapter {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async streamChat(
    messages: Message[],
    systemPrompt: string,
    _region: TourRegion
  ): Promise<ReadableStream<string>> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })

    return new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) controller.enqueue(text)
        }
        controller.close()
      },
    })
  }

  async chat(messages: Message[], systemPrompt: string, _region: TourRegion): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
    })
    return response.choices[0]?.message?.content ?? ''
  }
}

/**
 * Factory: returns the correct AI adapter based on tour region
 */
export function createAIAdapter(region: TourRegion): AIAdapter {
  if (region === 'CHINA') {
    const apiKey = process.env['DASHSCOPE_API_KEY']
    if (!apiKey) throw new Error('DASHSCOPE_API_KEY is required for China tours')
    return new QwenAdapter(apiKey)
  }
  // Global: prefer GPT, fallback to Claude
  const openaiKey = process.env['OPENAI_API_KEY']
  if (openaiKey) return new GPTAdapter(openaiKey)
  const anthropicKey = process.env['ANTHROPIC_API_KEY']
  if (!anthropicKey) throw new Error('OPENAI_API_KEY or ANTHROPIC_API_KEY is required')
  return new ClaudeAdapter(anthropicKey)
}

/**
 * Build Thai travel assistant system prompt
 */
export function buildTravelSystemPrompt(context: {
  tourTitle: string
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
}): string {
  return `คุณคือผู้ช่วยการท่องเที่ยวส่วนตัวของ TripFlow ที่ตอบเป็นภาษาไทยเสมอ

ทริป: ${context.tourTitle}
วันนี้: วันที่ ${context.dayNumber} — ${context.city}, ${context.country}
เวลาท้องถิ่น: ${context.localTime} (${context.timezone})
กำหนดการวันนี้: ${context.todayActivities}
ที่พัก: ${context.accommodationName ?? 'ไม่มีข้อมูล'}
สภาพอากาศ: ${context.weatherSummary}
กลุ่ม: ${context.memberCount} คน

คำแนะนำ:
- ตอบเป็นภาษาไทยเสมอ
- ถ้าถามเรื่องอาหาร ให้แนะนำร้านใกล้ ${context.city}
- ถ้าถามเรื่องการเดินทาง ดูจากแผนเส้นทางด้านบน
- ถ้าอยู่ในจีน และถามคำศัพท์จีน ให้บอกทั้งอักษรจีน พินอิน และความหมาย
${context.exchangeRate ? `- อัตราแลกเปลี่ยนวันนี้: ${context.exchangeRate}` : ''}
- เบอร์ฉุกเฉิน: ${context.emergency}`
}
