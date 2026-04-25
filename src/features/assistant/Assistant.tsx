import { useEffect, useRef, useState } from 'react'
import { runCommand } from './commands'

type Msg = { id: number; role: 'user' | 'assistant'; text: string; ts: number }

export function Assistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const h = (window as any).helios
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    h.assistant.getMessages().then((m: Msg[]) => setMessages(m || []))
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setBusy(true)
    setInput('')
    const userMsg: Msg = await h.assistant.addMessage('user', text)
    setMessages((m) => [...m, userMsg])
    try {
      const result = await runCommand(text)
      const reply: Msg = await h.assistant.addMessage('assistant', result.reply)
      setMessages((m) => [...m, reply])
    } catch (err: any) {
      const reply: Msg = await h.assistant.addMessage('assistant', 'Error: ' + (err?.message || String(err)))
      setMessages((m) => [...m, reply])
    } finally {
      setBusy(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  async function clear() {
    await h.assistant.clear()
    setMessages([])
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.14s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)',
          maxHeight: '70vh',
          background: 'var(--bg-0)',
          border: '1px solid var(--border-1)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'popIn 0.18s cubic-bezier(0.22,1,0.36,1)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-0)',
          fontSize: 12,
          color: 'var(--text-2)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spark />
            <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Assistant</span>
            <span style={{ color: 'var(--text-2)' }}>· local · type "help"</span>
          </span>
          <button onClick={clear} style={{ fontSize: 12, color: 'var(--text-2)', padding: '2px 8px', borderRadius: 6 }}>
            Clear
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 80 }}>
          {messages.length === 0 ? (
            <div style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
              Try: <code style={{ color: 'var(--text-1)' }}>open spotify</code>,&nbsp;
              <code style={{ color: 'var(--text-1)' }}>new tab github</code>,&nbsp;
              <code style={{ color: 'var(--text-1)' }}>close all tabs</code>,&nbsp;
              <code style={{ color: 'var(--text-1)' }}>set theme dark</code>,&nbsp;
              <code style={{ color: 'var(--text-1)' }}>bookmark this</code>.
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{
                display: 'flex',
                gap: 10,
                marginBottom: 12,
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 24, height: 24, flexShrink: 0,
                  borderRadius: '50%',
                  background: m.role === 'user' ? 'var(--bg-3)' : 'var(--accent-dim)',
                  color: m.role === 'user' ? 'var(--text-1)' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600
                }}>
                  {m.role === 'user' ? 'U' : <Spark />}
                </div>
                <div style={{
                  flex: 1,
                  fontSize: 13,
                  color: 'var(--text-0)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {m.text}
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submit} style={{
          padding: 10,
          borderTop: '1px solid var(--border-0)',
          display: 'flex',
          gap: 8
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={busy ? 'Working...' : 'Ask the assistant — e.g. open spotify'}
            disabled={busy}
            style={{
              flex: 1,
              height: 36,
              fontSize: 13,
              background: 'var(--bg-2)',
              border: '1px solid var(--border-1)',
              borderRadius: 10,
              padding: '0 12px',
              color: 'var(--text-0)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            style={{
              padding: '0 14px',
              height: 36,
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 500,
              opacity: (busy || !input.trim()) ? 0.5 : 1
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

function Spark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.6 5.5L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.5L12 2zM19 14l.8 2.7L22 17.5l-2.2.7L19 21l-.8-2.7L16 17.5l2.2-.8L19 14z"/>
    </svg>
  )
}
