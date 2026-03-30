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

  const hasInput = input.trim().length > 0

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatDot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes sendPulse {
          0% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #ede9f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #e8eaf2 0%, transparent 70%)' }} />
      </div>

      <TopBar
        title="AI ช่วยเหลือ"
        subtitle={isOffline ? 'ออฟไลน์' : isChina ? 'Qwen (จีน)' : 'Claude'}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-10" style={{ padding: '20px 16px 160px 16px' }}>
        <div className="max-w-[680px] mx-auto space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2.5'}`}
              style={{ animation: 'chatMsgIn 0.3s ease-out both' }}
            >
              {/* AI avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <svg className="w-4 h-4" style={{ color: '#fb923c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
              )}

              {/* Bubble */}
              {msg.role === 'user' ? (
                <div
                  className="max-w-[80%] px-4 py-3 text-[14px] text-[#f8f8fc]"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #c2410c)',
                    borderRadius: '18px 4px 18px 18px',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                    lineHeight: '1.7',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div
                  className="max-w-[80%] px-4 py-3 text-[14px] text-[#1a1a2e]"
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(16px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                    border: '1px solid rgba(255,255,255,0.88)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 12px rgba(0,0,0,0.05)',
                    borderRadius: '4px 18px 18px 18px',
                    lineHeight: '1.7',
                  }}
                >
                  {msg.content ? (
                    <ReactMarkdown
                      components={{
                        p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-[#1a1a2e]">{children}</strong>,
                        em:     ({ children }) => <em className="italic">{children}</em>,
                        ul:     ({ children }) => <ul className="list-disc list-inside space-y-0.5 mt-1">{children}</ul>,
                        ol:     ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mt-1">{children}</ol>,
                        li:     ({ children }) => <li className="text-sm">{children}</li>,
                        h3:     ({ children }) => <h3 className="font-bold text-sm mt-2 mb-0.5 text-[#1a1a2e]">{children}</h3>,
                        code:   ({ children }) => <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}>{children}</code>,
                        hr:     () => <hr style={{ border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.06)', margin: '8px 0' }} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : isLoading ? (
                    <span className="flex gap-1.5 items-center py-1">
                      {[0, 1, 2].map(d => (
                        <span key={d} className="w-2 h-2 rounded-full" style={{ background: d === 0 ? '#fb923c' : d === 1 ? '#f97316' : '#ea580c', animation: `chatDot 1.2s ease-in-out ${d * 0.15}s infinite` }} />
                      ))}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — fixed bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(240,242,248,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(0,0,0,0.06)',
          padding: '10px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-[680px] mx-auto space-y-2">
          {/* Quick reply chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {quickReplies.map((r) => (
              <button
                key={r}
                onClick={() => sendMessage(r)}
                className="flex-shrink-0 h-[34px] px-3.5 rounded-[20px] text-[13px] font-medium whitespace-nowrap no-btn-fx active:scale-[0.97] transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  color: '#3d3a5c',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(249,115,22,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'
                  e.currentTarget.style.color = '#f97316'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.65)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.85)'
                  e.currentTarget.style.color = '#3d3a5c'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={isOffline ? 'ไม่มีอินเทอร์เน็ต' : 'พิมพ์ข้อความ...'}
              disabled={isOffline}
              className="flex-1 h-11 px-4 rounded-[22px] text-[15px] text-[#1a1a2e] placeholder:text-[rgba(30,30,60,0.3)] disabled:opacity-50 focus:outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.88)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.04)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px rgba(249,115,22,0.08)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.88)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.04)'
              }}
            />
            <button
              onClick={() => { sendMessage(input) }}
              disabled={!hasInput || isLoading}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 no-btn-fx transition-all duration-200 active:scale-[0.92]"
              style={hasInput && !isLoading ? {
                background: 'linear-gradient(135deg, #f97316, #c2410c)',
                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              } : {
                background: 'rgba(0,0,0,0.06)',
              }}
            >
              <svg className="w-[18px] h-[18px]" style={{ color: hasInput && !isLoading ? '#f8f8fc' : 'rgba(30,30,60,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
