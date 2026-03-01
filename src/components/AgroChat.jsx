import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Sprout } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const SYSTEM_PROMPT = `You are AgroAI, an expert agricultural assistant for Maharashtra sugarcane farmers in India. You help farmers with questions about:
- Sugarcane cultivation (planting, fertilization, irrigation, pest control, harvesting)
- Weather and seasonal advice
- Soil health and crop varieties
- Yield improvement and market rates
- Government schemes and FRP (Fair Remunerative Price)

IMPORTANT LANGUAGE RULES:
- Detect the language of the user's message automatically.
- If the user writes in Hindi (Devanagari script ending in Hindi patterns), reply ONLY in Hindi.
- If the user writes in Marathi (Devanagari script with Marathi words), reply ONLY in Marathi.
- If the user writes in English, reply ONLY in English.
- If the message has a language override prefix like [RESPOND IN HINDI], [RESPOND IN MARATHI], or [RESPOND IN ENGLISH], follow that strictly.
- Keep responses concise (3-5 sentences max), practical, and farmer-friendly.
- Do not discuss topics unrelated to agriculture.`

const LANG_OPTIONS = [
  { code: 'en', label: 'EN', langInstruction: '[RESPOND IN ENGLISH]' },
  { code: 'hi', label: 'हि', langInstruction: '[RESPOND IN HINDI]' },
  { code: 'mr', label: 'मर', langInstruction: '[RESPOND IN MARATHI]' },
]

const WELCOME_MESSAGES = {
  en: "🌾 Hello! I'm AgroAI, your sugarcane farming assistant. Ask me anything about crop health, fertilizers, weather, or market rates!",
  hi: "🌾 नमस्ते! मैं AgroAI हूँ, आपका गन्ना खेती सहायक। फसल स्वास्थ्य, खाद, मौसम या बाजार भाव के बारे में कुछ भी पूछें!",
  mr: "🌾 नमस्कार! मी AgroAI आहे, तुमचा ऊस शेती सहाय्यक. पिकाचे आरोग्य, खते, हवामान किंवा बाजारभावाबद्दल काहीही विचारा!",
}

export default function AgroChat() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatLang, setChatLang] = useState(null) // null = auto-detect
  const [hasOpened, setHasOpened] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Sync chatLang with global i18n language on first open
  const openChat = () => {
    setIsOpen(true)
    if (!hasOpened) {
      setHasOpened(true)
      const lang = i18n.language || 'en'
      const validLang = ['en', 'hi', 'mr'].includes(lang) ? lang : 'en'
      setChatLang(null) // keep auto-detect but show welcome in current lang
      setMessages([
        {
          id: Date.now(),
          role: 'bot',
          text: WELCOME_MESSAGES[validLang] || WELCOME_MESSAGES.en,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [messages, isOpen])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in .env')

      // Build the user content with optional language override prefix
      const selectedLangOption = LANG_OPTIONS.find(l => l.code === chatLang)
      const langPrefix = selectedLangOption ? selectedLangOption.langInstruction + ' ' : ''
      const userContent = langPrefix + trimmed

      // Build conversation history for context (last 6 messages)
      const historyContents = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))

      const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          ...historyContents,
          { role: 'user', parts: [{ text: userContent }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }

      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `API error: ${res.status}`)
      }

      const data = await res.json()
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Sorry, I could not generate a response. Please try again.'

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      console.error('AgroChat error:', err)
      const errorText =
        chatLang === 'hi'
          ? '⚠️ त्रुटि: AI से कनेक्ट नहीं हो सका। कृपया अपनी API कुंजी जाँचें।'
          : chatLang === 'mr'
            ? '⚠️ त्रुटी: AI शी कनेक्ट होता आले नाही. कृपया API की तपासा.'
            : '⚠️ Error: Could not connect to AI. Please check your API key.'
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: errorText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        className="agrochat-fab"
        onClick={openChat}
        title="Ask AgroAI"
        aria-label="Open AgroAI Chatbot"
      >
        <MessageCircle size={26} strokeWidth={2} />
        <span className="agrochat-fab-pulse" />
      </button>

      {/* ── Chat window ── */}
      <div className={`agrochat-window ${isOpen ? 'agrochat-open' : ''}`}>
        {/* Header */}
        <div className="agrochat-header">
          <div className="agrochat-header-left">
            <div className="agrochat-avatar">
              <Sprout size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="agrochat-title">AgroAI Assistant</p>
              <p className="agrochat-subtitle">Powered by Gemini 1.5 Flash</p>
            </div>
          </div>
          <div className="agrochat-header-right">
            {/* Language selector */}
            <div className="agrochat-lang-tabs">
              <button
                className={`agrochat-lang-btn ${chatLang === null ? 'active' : ''}`}
                onClick={() => setChatLang(null)}
                title="Auto-detect language"
              >
                Auto
              </button>
              {LANG_OPTIONS.map(l => (
                <button
                  key={l.code}
                  className={`agrochat-lang-btn ${chatLang === l.code ? 'active' : ''}`}
                  onClick={() => setChatLang(l.code)}
                  title={l.label}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button className="agrochat-close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="agrochat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`agrochat-bubble-row ${msg.role}`}>
              {msg.role === 'bot' && (
                <div className="agrochat-icon bot-icon">
                  <Bot size={14} />
                </div>
              )}
              <div className={`agrochat-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <p>{msg.text}</p>
                <span className="agrochat-time">{msg.time}</span>
              </div>
              {msg.role === 'user' && (
                <div className="agrochat-icon user-icon">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="agrochat-bubble-row bot">
              <div className="agrochat-icon bot-icon">
                <Bot size={14} />
              </div>
              <div className="agrochat-bubble bot typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="agrochat-input-bar">
          <textarea
            ref={inputRef}
            className="agrochat-input"
            placeholder={
              chatLang === 'hi'
                ? 'कृषि प्रश्न पूछें...'
                : chatLang === 'mr'
                  ? 'शेतीविषयक प्रश्न विचारा...'
                  : 'Ask a farming question...'
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="agrochat-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={18} className="spin-anim" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        /* ── FAB ── */
        .agrochat-fab {
          position: fixed;
          bottom: 6.5rem;
          right: 2rem;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(16,185,129,0.45);
          z-index: 1000;
          transition: transform 0.2s, box-shadow 0.2s;
          position: fixed;
        }
        .agrochat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 30px rgba(16,185,129,0.55);
        }
        .agrochat-fab-pulse {
          position: absolute;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(16,185,129,0.35);
          animation: agro-pulse 2s infinite;
        }
        @keyframes agro-pulse {
          0%   { transform: scale(1); opacity: 0.7; }
          70%  { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        /* ── Window ── */
        .agrochat-window {
          position: fixed;
          bottom: 10.5rem;
          right: 2rem;
          width: 360px;
          max-height: 520px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10);
          display: flex;
          flex-direction: column;
          z-index: 999;
          overflow: hidden;
          transform: translateY(30px) scale(0.95);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
          border: 1px solid rgba(16,185,129,0.2);
        }
        .agrochat-window.agrochat-open {
          transform: translateY(0) scale(1);
          opacity: 1;
          pointer-events: all;
        }

        /* ── Header ── */
        .agrochat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          background: linear-gradient(135deg, #064e3b, #065f46);
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .agrochat-header-left {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .agrochat-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(16,185,129,0.25);
          border: 1.5px solid rgba(16,185,129,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #34d399;
          flex-shrink: 0;
        }
        .agrochat-title {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: #ecfdf5;
          line-height: 1.2;
        }
        .agrochat-subtitle {
          margin: 0;
          font-size: 0.72rem;
          color: #6ee7b7;
          line-height: 1.2;
        }
        .agrochat-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .agrochat-lang-tabs {
          display: flex;
          gap: 0.2rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 2px;
        }
        .agrochat-lang-btn {
          background: transparent;
          border: none;
          color: #a7f3d0;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 7px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          line-height: 1.4;
          font-family: inherit;
        }
        .agrochat-lang-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .agrochat-lang-btn.active { background: #10b981; color: #fff; }
        .agrochat-close-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: #a7f3d0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .agrochat-close-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }

        /* ── Messages ── */
        .agrochat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: #f8fafc;
          scroll-behavior: smooth;
        }
        .agrochat-messages::-webkit-scrollbar { width: 4px; }
        .agrochat-messages::-webkit-scrollbar-track { background: transparent; }
        .agrochat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        .agrochat-bubble-row {
          display: flex;
          align-items: flex-end;
          gap: 0.4rem;
        }
        .agrochat-bubble-row.user { flex-direction: row-reverse; }

        .agrochat-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bot-icon { background: #d1fae5; color: #059669; }
        .user-icon { background: #dbeafe; color: #2563eb; }

        .agrochat-bubble {
          max-width: 78%;
          padding: 0.65rem 0.9rem;
          border-radius: 14px;
          font-size: 0.88rem;
          line-height: 1.55;
          position: relative;
        }
        .agrochat-bubble p {
          margin: 0 0 0.25rem 0;
          color: #1e293b;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .agrochat-bubble.bot {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .agrochat-bubble.user {
          background: linear-gradient(135deg, #10b981, #059669);
          border-bottom-right-radius: 4px;
        }
        .agrochat-bubble.user p { color: #fff; }
        .agrochat-bubble.error { background: #fef2f2; border-color: #fca5a5; }
        .agrochat-bubble.error p { color: #dc2626; }

        .agrochat-time {
          display: block;
          font-size: 0.67rem;
          color: #94a3b8;
          text-align: right;
          margin-top: 2px;
        }
        .agrochat-bubble.user .agrochat-time { color: rgba(255,255,255,0.7); }

        /* Typing dots */
        .agrochat-bubble.typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0.75rem 1rem;
          min-width: 52px;
        }
        .agrochat-bubble.typing .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: bounce-dot 1.2s infinite;
        }
        .agrochat-bubble.typing .dot:nth-child(2) { animation-delay: 0.2s; }
        .agrochat-bubble.typing .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* ── Input bar ── */
        .agrochat-input-bar {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          padding: 0.75rem 0.85rem;
          border-top: 1px solid #e2e8f0;
          background: #fff;
          flex-shrink: 0;
        }
        .agrochat-input {
          flex: 1;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: #0f172a;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          max-height: 100px;
          overflow-y: auto;
          line-height: 1.5;
        }
        .agrochat-input:focus { border-color: #10b981; background: #fff; }
        .agrochat-input::placeholder { color: #94a3b8; }
        .agrochat-input:disabled { opacity: 0.6; }

        .agrochat-send-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(16,185,129,0.35);
        }
        .agrochat-send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 4px 12px rgba(16,185,129,0.45);
        }
        .agrochat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .spin-anim { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .agrochat-window {
            right: 0.75rem;
            left: 0.75rem;
            width: auto;
            bottom: 9.5rem;
          }
          .agrochat-fab {
            right: 1rem;
            bottom: 5.5rem;
          }
        }
      `}</style>
    </>
  )
}
