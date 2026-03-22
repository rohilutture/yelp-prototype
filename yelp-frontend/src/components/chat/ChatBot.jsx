import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useChat } from '../../context/AppContext'
import { aiService } from '../../services'

const QUICK_PROMPTS = [
  'Find dinner tonight',
  'Best rated near me',
  'Vegan options',
  'Romantic spot',
]

// Simple markdown renderer — handles **bold**, *italic*, _italic_
function renderMarkdown(text) {
  const parts = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g
  let last = 0
  let match
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>)
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={key++} className="font-semibold">{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>)
    } else if (match[3] !== undefined) {
      parts.push(<em key={key++}>{match[3]}</em>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return parts.length > 0 ? parts : text
}

function FormattedMessage({ content }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-surface-800 leading-relaxed">
          {renderMarkdown(line)}
        </p>
      ))}
    </div>
  )
}

export default function ChatBot() {
  const { messages, isOpen, setIsOpen, isThinking, setIsThinking, addMessage, clearChat } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || isThinking) return
    setInput('')
    addMessage({ role: 'user', content: msg })
    setIsThinking(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const { data } = await aiService.chat(msg, history)
      addMessage({ role: 'assistant', content: data.message, restaurants: data.restaurants })
    } catch {
      addMessage({ role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' })
    } finally {
      setIsThinking(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-white rounded-2xl shadow-card-hover border border-surface-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-500 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">✦</span>
          <div>
            <p className="font-medium text-sm leading-none">AI Assistant</p>
            <p className="text-xs text-brand-200 mt-0.5">Powered by your preferences</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-brand-400 transition-colors text-xs">
            Clear
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-brand-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">🍴</p>
            <p className="text-sm text-surface-800 font-medium">What are you craving?</p>
            <p className="text-xs text-surface-200 mt-1">I'll find restaurants based on your preferences</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="px-3 py-1.5 rounded-full border border-surface-200 text-xs text-surface-800 hover:bg-surface-50 hover:border-brand-300 transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user'
              ? 'bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm'
              : 'space-y-2'}`}>
              {msg.role === 'assistant' ? (
                <>
                  <div className="bg-surface-50 border border-surface-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <FormattedMessage content={msg.content} />
                  </div>
                  {msg.restaurants?.length > 0 && (
                    <div className="space-y-2 pl-1">
                      {msg.restaurants.map((r) => (
                        <Link key={r.id} to={`/restaurants/${r.id}`}
                          className="flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all">
                          <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-xl shrink-0">
                            🍽️
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{r.name}</p>
                            <p className="text-xs text-surface-200 truncate">{r.cuisine_type} · {'★'.repeat(Math.round(r.avg_rating ?? 0))}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-surface-50 border border-surface-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-surface-200 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-surface-100">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything…"
            className="input flex-1 text-sm py-2"
            disabled={isThinking}
          />
          <button type="submit" disabled={!input.trim() || isThinking} className="btn-primary px-3 py-2 text-sm shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
