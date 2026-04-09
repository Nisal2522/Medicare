import { isAxiosError } from 'axios'
import { AlertTriangle, Send, Sparkles, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeSymptoms, type SymptomAnalysisResponse } from '../../api/aiApi'
import { brandButtonClass } from '../../components/LandingNavbar'
import { specialtyForDoctorSearch } from '../../constants/medicalSpecialties'
import { useAuth } from '../../context/AuthContext'
import {
  appPageHeader,
  appPageSubtitle,
  appPageTitle,
  appPageWrap,
  appSectionEyebrow,
} from '../../lib/uiTheme'

const DISCLAIMER =
  'This is an AI-generated suggestion and not a substitute for professional medical advice.'

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string
      role: 'assistant'
      text: string
      analysis?: SymptomAnalysisResponse
      error?: string
    }

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function urgencyPillClass(level: string): string {
  if (level === 'High') {
    return 'bg-rose-100 text-rose-900 ring-1 ring-rose-200/80'
  }
  if (level === 'Medium') {
    return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80'
  }
  return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80'
}

function urgencyReadable(level: string): string {
  return `${level} urgency`
}

function TypingDots() {
  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-sky-400"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  )
}

export default function AiHealthAssistantPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || !token || loading) return
    setInput('')
    const userMsg: ChatMessage = { id: uid(), role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setLoading(true)
    try {
      const analysis = await analyzeSymptoms(text, token)
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: '',
          analysis,
        },
      ])
    } catch (e) {
      const msg = isAxiosError(e)
        ? (() => {
            const d = e.response?.data as { message?: string | string[] }
            if (Array.isArray(d?.message)) return d.message.join(', ')
            if (typeof d?.message === 'string') return d.message
            return e.message || 'Request failed'
          })()
        : 'Something went wrong'
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: 'I could not complete the analysis.',
          error: typeof msg === 'string' ? msg : 'Request failed',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, token, loading])

  const findDoctors = (specialty: string) => {
    const s = specialtyForDoctorSearch(specialty)
    navigate(`/find-doctor?specialty=${encodeURIComponent(s)}`)
  }

  return (
    <div className={appPageWrap}>
      <header className={appPageHeader}>
        <p className={appSectionEyebrow}>AI tools</p>
        <h1 className={`mt-2 flex items-center gap-2 ${appPageTitle}`}>
          <Sparkles className="h-8 w-8 text-sky-600" aria-hidden />
          Symptom Checker
        </h1>
        <p className={appPageSubtitle}>
          Describe how you feel in your own words. You will get general guidance only —
          always follow up with a qualified clinician.
        </p>
      </header>

      <div
        className="flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm"
        role="note"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          aria-hidden
        />
        <p>
          <span className="font-semibold">Important: </span>
          {DISCLAIMER} If you have severe or emergency symptoms, seek urgent or
          emergency care immediately.
        </p>
      </div>

      <div className="flex h-[min(32rem,70vh)] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card-soft">
        <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
          <p className="text-xs font-medium text-sky-800">Symptom conversation</p>
          <p className="text-[11px] text-slate-500">
            Messages stay in this session only (not stored as medical records).
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-6 text-center text-sm text-slate-600">
              <Stethoscope className="mx-auto mb-2 h-8 w-8 text-sky-500" aria-hidden />
              <p className="font-medium text-slate-800">Try an example</p>
              <p className="mt-1">
                e.g. “Mild headache and sore throat for two days, no fever.”
              </p>
            </div>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                    : 'border border-slate-100 bg-slate-50 text-slate-800'
                }`}
              >
                {m.text ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : null}
                {m.role === 'assistant' && m.error ? (
                  <p className="mt-2 text-xs text-rose-700">{m.error}</p>
                ) : null}
                {m.role === 'assistant' && m.analysis ? (
                  <div className="mt-1 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-800">
                      {m.analysis.summary}
                    </p>
                    <div className="rounded-xl border border-sky-100 bg-white p-4 text-slate-800 shadow-sm">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Preliminary condition
                          </p>
                          <p className="mt-1 text-base font-bold text-slate-900">
                            {m.analysis.preliminaryCondition}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Recommended specialty
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            {m.analysis.recommendedSpecialty}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Urgency level
                          </p>
                          <p className="mt-1.5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${urgencyPillClass(m.analysis.urgencyLevel)}`}
                            >
                              {urgencyReadable(m.analysis.urgencyLevel)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg border border-amber-200/90 bg-[#FEF9C3] px-3 py-2.5 text-center text-xs leading-snug text-amber-950">
                        {m.analysis.disclaimer}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          findDoctors(m.analysis!.recommendedSpecialty)
                        }
                        className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition hover:brightness-105 ${brandButtonClass}`}
                      >
                        Find {m.analysis.recommendedSpecialty} doctors
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Analyzing symptoms…
                </p>
                <TypingDots />
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-sky-100 bg-white p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
              rows={2}
              placeholder="Type your symptoms…"
              className="min-h-[3rem] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              disabled={!token || loading}
              aria-label="Symptom description"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!token || loading || !input.trim()}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 ${brandButtonClass}`}
              aria-label="Send"
            >
              <Send className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {!token ? (
            <p className="mt-2 text-center text-xs text-rose-600">
              Sign in as a patient to use this assistant.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
