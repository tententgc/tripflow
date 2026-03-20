'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickReplies = ['วันนี้ทำอะไรบ้าง', 'ร้านอาหารใกล้ๆ', 'ไปโรงแรมยังไง', 'เบอร์ฉุกเฉิน', 'แปลภาษาช่วย']

export default function ChatPage() {
  const params = useParams()
  const tourId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChina, setIsChina] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => {
        setIsChina(data.isChina)
        setMessages([{
          role: 'assistant',
          content: `สวัสดีครับ! ผมคือผู้ช่วย TripFlow สำหรับทริป "${data.title}" มีอะไรให้ช่วยไหมครับ?`,
        }])
      })
      .catch(() => setIsOffline(true))
  }, [tourId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(`/api/tours/${tourId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], tourContext: { tourId } }),
      })

      if (!res.ok || !res.body) throw new Error('no response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data) as { text: string }
            assistantText += text
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: assistantText }
              return updated
            })
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'ขออภัย ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar
        title="AI ช่วยเหลือ"
        subtitle={isOffline ? '● ออฟไลน์' : isChina ? '● Qwen (จีน)' : '● Claude'}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-br-sm shadow-md shadow-indigo-500/20'
                : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
            }`}>
              {msg.content || (isLoading && msg.role === 'assistant' ? <span className="animate-pulse">กำลังพิมพ์...</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 space-y-2 pb-safe shadow-lg">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickReplies.map((r) => (
            <button key={r} onClick={() => sendMessage(r)}
              className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium whitespace-nowrap border border-indigo-100">
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={isOffline ? 'ไม่มีอินเทอร์เน็ต' : 'พิมพ์ข้อความ...'}
            disabled={isOffline}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-full flex items-center justify-center disabled:opacity-40 shadow-md shadow-indigo-500/20"
          >
            <span className="text-white text-sm">↑</span>
          </button>
        </div>
      </div>
    </div>
  )
}
