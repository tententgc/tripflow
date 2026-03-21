'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { useApi } from '@/lib/swr'
import dynamic from 'next/dynamic'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false })

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
  const [isOffline, setIsOffline] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { data: tourInfo, error: tourError } = useApi<{ title: string; isChina: boolean }>(`/api/tours/${tourId}`)
  const isChina = tourInfo?.isChina ?? false

  useEffect(() => {
    if (tourInfo && !greeted) {
      setMessages([{
        role: 'assistant',
        content: `สวัสดีครับ! ผมคือผู้ช่วย TripFlow สำหรับทริป "${tourInfo.title}" มีอะไรให้ช่วยไหมครับ?`,
      }])
      setGreeted(true)
    }
    if (tourError) setIsOffline(true)
  }, [tourInfo, tourError, greeted])

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
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })

      if (!res.ok || !res.body) throw new Error('no response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      let buffer = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break outer
          try {
            const parsed = JSON.parse(data) as { text: string }
            if (parsed.text) {
              assistantText += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'ขออภัย ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50/20 flex flex-col">
      <TopBar
        title="AI ช่วยเหลือ"
        subtitle={isOffline ? 'ออฟไลน์' : isChina ? 'Qwen (จีน)' : 'Claude'}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-br-md'
                : 'bg-white/80 backdrop-blur-xl text-gray-900 border border-indigo-100/40 rounded-bl-md'
            }`}>
              {msg.role === 'assistant' ? (
                msg.content ? (
                  <ReactMarkdown
                    components={{
                      p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em:     ({ children }) => <em className="italic">{children}</em>,
                      ul:     ({ children }) => <ul className="list-disc list-inside space-y-0.5 mt-1">{children}</ul>,
                      ol:     ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mt-1">{children}</ol>,
                      li:     ({ children }) => <li className="text-sm">{children}</li>,
                      h3:     ({ children }) => <h3 className="font-bold text-sm mt-2 mb-0.5">{children}</h3>,
                      code:   ({ children }) => <code className="bg-indigo-50/60 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      hr:     () => <hr className="border-indigo-100/40 my-2" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : isLoading ? (
                  <span className="flex gap-1 items-center py-0.5">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : null
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area — glass */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-gray-200/50 px-4 py-3 space-y-2 pb-safe">
        {/* Quick replies */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickReplies.map((r) => (
            <button key={r} onClick={() => sendMessage(r)}
              className="flex-shrink-0 px-3 py-1.5 bg-white/60 backdrop-blur-sm text-indigo-600 rounded-full text-xs font-medium whitespace-nowrap border border-indigo-100/60 hover:bg-indigo-50/50 active:scale-[0.97] transition-all">
              {r}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={isOffline ? 'ไม่มีอินเทอร์เน็ต' : 'พิมพ์ข้อความ...'}
            disabled={isOffline}
            className="flex-1 px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center disabled:opacity-40 shadow-sm shadow-indigo-200/50 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
