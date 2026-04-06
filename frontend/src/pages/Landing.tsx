import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileLock2,
  Fingerprint,
  Globe2,
  LineChart,
  Lock,
  MessageCircle,
  MessagesSquare,
  Network,
  PhoneCall,
  PlayCircle,
  Plug,
  Radar,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Star,
  TrendingUp,
  Video,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchPublicLandingPayload } from '../api/platformLandingApi'
import { LandingNavbar, brandGradientBar } from '../components/LandingNavbar'

const trustBadges = [
  'ISO-aligned controls',
  'End-to-end encryption',
  'Audit-ready logs',
]

/** Reliable fallback if an Unsplash URL fails (network / regional blocks) */
const FALLBACK_SLIDE_IMAGE =
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80'

const heroSlides = [
  {
    id: 's1',
    image:
      'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?auto=format&fit=crop&w=1600&q=80',
    alt: 'Clinician reviewing live patient telemetry on a large display',
    kicker: 'Command center',
    headline: 'Unified vitals & queue intelligence',
    subline: 'Real-time orchestration across wards, telehealth, and follow-ups.',
    metric: 'Latency under 120ms · 99.95% session stability',
  },
  {
    id: 's2',
    image:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80',
    alt: 'Medical technology and digital interface concept',
    kicker: 'Neural triage',
    headline: 'Assistive AI with physician guardrails',
    subline: 'Structured intake that respects clinical protocols and escalation paths.',
    metric: '38% fewer redundant triage calls',
  },
  {
    id: 's3',
    image:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80',
    alt: 'Doctor and patient during a video consultation',
    kicker: 'Telepresence',
    headline: 'Cinematic HD visits, zero friction',
    subline: 'Adaptive bitrate, device checks, and encrypted waiting-room flows.',
    metric: '4.9★ average visit experience',
  },
  {
    id: 's4',
    image:
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1600&q=80',
    alt: 'Secure medical records and data protection concept',
    kicker: 'Zero-trust vault',
    headline: 'Reports & scripts, sealed end-to-end',
    subline: 'Granular sharing, watermarking, and audit trails baked into every artifact.',
    metric: 'SOC 2 roadmap · RBAC everywhere',
  },
] as const

const steps = [
  {
    step: '01',
    title: 'Tell us what you feel',
    body: 'Guided intake captures symptoms, history, and urgency signals in under two minutes.',
    icon: BrainCircuit,
  },
  {
    step: '02',
    title: 'AI + clinician review',
    body: 'Our engine surfaces differential insights; licensed providers validate the next best step.',
    icon: Stethoscope,
  },
  {
    step: '03',
    title: 'Care, delivered securely',
    body: 'Book video visits, receive prescriptions, and access encrypted reports in one timeline.',
    icon: Shield,
  },
]

const platformFeatures: {
  title: string
  body: string
  Icon: LucideIcon
  iconWrap: string
  cardClass: string
}[] = [
  {
    title: 'Unified care timeline',
    body: 'Every visit, lab, and message stays organized with clinician-ready summaries.',
    Icon: LineChart,
    iconWrap:
      'bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 ring-1 ring-white/20',
    cardClass:
      'border-sky-200/60 bg-gradient-to-br from-sky-50/70 via-white to-white shadow-[0_20px_50px_-24px_rgba(14,165,233,0.2)]',
  },
  {
    title: 'Smart scheduling',
    body: 'Real-time availability, reminders, and no-show reduction across channels.',
    Icon: CalendarClock,
    iconWrap:
      'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 ring-1 ring-white/20',
    cardClass:
      'border-blue-200/60 bg-gradient-to-br from-blue-50/70 via-white to-white shadow-[0_20px_50px_-24px_rgba(37,99,235,0.18)]',
  },
  {
    title: 'Team-based access',
    body: 'Role-aware permissions for patients, doctors, and administrators.',
    Icon: Network,
    iconWrap:
      'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20',
    cardClass:
      'border-cyan-200/60 bg-gradient-to-br from-cyan-50/70 via-white to-white shadow-[0_20px_50px_-24px_rgba(6,182,212,0.18)]',
  },
  {
    title: 'Clinical messaging',
    body: 'Secure threads with attachments, read receipts, and escalation paths.',
    Icon: MessagesSquare,
    iconWrap:
      'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20',
    cardClass:
      'border-indigo-200/60 bg-gradient-to-br from-indigo-50/70 via-white to-white shadow-[0_20px_50px_-24px_rgba(99,102,241,0.15)]',
  },
]

const showcaseFeatures = [
  {
    title: 'AI Symptom Checker',
    description:
      'Adaptive questionnaires map symptoms to evidence-based pathways, always paired with human oversight.',
    icon: BrainCircuit,
    image:
      'https://images.unsplash.com/photo-1581595219315-a187dd40c322?auto=format&fit=crop&w=900&q=80',
    bullets: ['Triage scoring', 'Red-flag alerts', 'Plain-language guidance'],
  },
  {
    title: 'HD Video Consultation',
    description:
      'Crystal-clear visits with low-latency streaming, device checks, and waiting-room transparency.',
    icon: Video,
    image:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    bullets: ['Virtual waiting room', 'Screen sharing', 'Visit recordings (opt-in)'],
  },
  {
    title: 'Encrypted Reports',
    description:
      'Structured diagnostics, imaging summaries, and e-prescriptions with granular sharing controls.',
    icon: FileLock2,
    image:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    bullets: ['PDF + FHIR-ready exports', 'Watermarking', 'Expiry links'],
  },
]

const securityPoints: {
  title: string
  body: string
  Icon: LucideIcon
  iconWrap: string
  cardClass: string
}[] = [
  {
    title: 'Zero-trust access',
    body: 'JWT sessions, device posture checks, and least-privilege roles for every account.',
    Icon: Fingerprint,
    iconWrap:
      'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 ring-1 ring-white/25',
    cardClass:
      'border-sky-200/50 bg-gradient-to-br from-sky-50/80 to-white backdrop-blur-sm',
  },
  {
    title: 'Data residency options',
    body: 'Configurable regions and retention windows to match your compliance posture.',
    Icon: Globe2,
    iconWrap:
      'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 ring-1 ring-white/25',
    cardClass:
      'border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-white backdrop-blur-sm',
  },
  {
    title: 'Continuous monitoring',
    body: 'Anomaly detection, immutable audit trails, and incident runbooks your IT team can trust.',
    Icon: Radar,
    iconWrap:
      'bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-white/25',
    cardClass:
      'border-cyan-200/50 bg-gradient-to-br from-cyan-50/80 to-white backdrop-blur-sm',
  },
]

const testimonials: {
  quote: string
  name: string
  role: string
  rating: number
  Icon: LucideIcon
  cardClass: string
  iconWrap: string
}[] = [
  {
    quote:
      'We cut phone triage volume by 38% while improving first-contact resolution. The handoff from AI intake to our physicians feels seamless.',
    name: 'Dr. Amaya Chen',
    role: 'Chief Medical Officer, NorthCare Clinics',
    rating: 5,
    Icon: TrendingUp,
    iconWrap: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25',
    cardClass:
      'border-sky-200/70 bg-gradient-to-br from-sky-50/90 via-white to-white shadow-[0_24px_60px_-28px_rgba(14,165,233,0.2)]',
  },
  {
    quote:
      'Patients finally understand their care plan. The timeline and secure messaging reduced repeat visits for the same questions.',
    name: 'Jordan Ellis',
    role: 'Director of Operations, PulseHealth',
    rating: 5,
    Icon: MessageCircle,
    iconWrap: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25',
    cardClass:
      'border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-white to-white shadow-[0_24px_60px_-28px_rgba(37,99,235,0.18)]',
  },
  {
    quote:
      'Security review was straightforward: clear RBAC, encryption everywhere, and exportable logs for our auditors.',
    name: 'Priya Nandakumar',
    role: 'Head of IT Compliance, MediCore',
    rating: 5,
    Icon: BadgeCheck,
    iconWrap: 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25',
    cardClass:
      'border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 via-white to-white shadow-[0_24px_60px_-28px_rgba(6,182,212,0.18)]',
  },
]

const faqItems: {
  q: string
  a: string
  Icon: LucideIcon
  accent: string
  bar: string
  iconTone: string
}[] = [
  {
    q: 'Is MediSmart AI a replacement for emergency care?',
    a: 'No. If you are experiencing an emergency, call your local emergency number immediately. MediSmart AI supports non-emergency navigation and follow-up care.',
    Icon: PhoneCall,
    accent: 'bg-sky-50/80',
    bar: 'border-l-[3px] border-sky-500',
    iconTone: 'text-sky-600 ring-sky-200/80',
  },
  {
    q: 'How do doctors use the AI outputs?',
    a: 'AI-generated insights are assistive only. Licensed clinicians review, amend, and approve every recommendation before it reaches a patient.',
    Icon: BrainCircuit,
    accent: 'bg-blue-50/80',
    bar: 'border-l-[3px] border-blue-600',
    iconTone: 'text-blue-600 ring-blue-200/80',
  },
  {
    q: 'Can we integrate with our EHR?',
    a: 'Yes. We provide APIs, webhooks, and export formats designed for common integration patterns. Enterprise plans include solution engineering support.',
    Icon: Plug,
    accent: 'bg-cyan-50/80',
    bar: 'border-l-[3px] border-cyan-500',
    iconTone: 'text-cyan-600 ring-cyan-200/80',
  },
  {
    q: 'What happens to my data?',
    a: 'Data is encrypted in transit and at rest. You control retention, sharing scopes, and can request exports or deletion subject to medical record policies.',
    Icon: Database,
    accent: 'bg-indigo-50/80',
    bar: 'border-l-[3px] border-indigo-500',
    iconTone: 'text-indigo-600 ring-indigo-200/80',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: 'easeOut' as const },
  }),
}

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24'

type HeroSlide = (typeof heroSlides)[number]

function HeroSlideImage({
  slide,
  reduceMotion,
}: {
  slide: HeroSlide
  reduceMotion: boolean | null
}) {
  return (
    <motion.img
      key={slide.id}
      src={slide.image}
      alt={slide.alt}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={(e) => {
        const el = e.currentTarget
        if (el.src !== FALLBACK_SLIDE_IMAGE) el.src = FALLBACK_SLIDE_IMAGE
      }}
      initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

function HeroSlideshow({
  slides,
  reduceMotion,
}: {
  slides: readonly HeroSlide[]
  reduceMotion: boolean | null
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduceMotion || paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 5200)
    return () => window.clearInterval(id)
  }, [slides.length, reduceMotion, paused])

  const go = (dir: -1 | 1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length)
  }

  const slide = slides[index]

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-sky-200/60 bg-white shadow-[0_28px_90px_-20px_rgba(15,23,42,0.18)] ring-1 ring-sky-400/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product preview slideshow"
    >
      <div className="relative aspect-[4/3] min-h-[260px] sm:min-h-[320px] lg:min-h-[360px]">
        <AnimatePresence mode="wait" initial={false}>
          <HeroSlideImage key={slide.id} slide={slide} reduceMotion={reduceMotion} />
        </AnimatePresence>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/82 via-[#0f172a]/2 to-transparent"
          aria-hidden
        />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
          </span>
          Live signal
        </div>
        <div className="absolute right-4 top-4 rounded-lg border border-white/20 bg-black/25 px-2.5 py-1 font-mono text-[11px] tabular-nums text-white/95 backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300 sm:text-[11px]">
            {slide.kicker}
          </p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {slide.headline}
          </p>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/88">{slide.subline}</p>
          <p className="mt-3 inline-flex rounded-lg border border-sky-400/35 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100">
            {slide.metric}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-2 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 justify-center gap-1.5 sm:gap-2" role="tablist" aria-label="Slide indicators">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === index}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === index ? 'w-8 bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.6)]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              onClick={() => setIndex(idx)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function scrollToId(href: string) {
  const id = href.replace('#', '')
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

type LandingStatCard = { label: string; value: string; hint: string }

function buildStatCardsFromPayload(p: {
  doctorCount: number
  patientCount: number
  consultationsToday: number
  totalBookings: number
}): LandingStatCard[] {
  return [
    {
      label: 'Verified doctors',
      value: p.doctorCount.toLocaleString(),
      hint: 'Active doctor accounts in the platform',
    },
    {
      label: 'Active patients',
      value: p.patientCount.toLocaleString(),
      hint: 'Registered patient accounts',
    },
    {
      label: "Today's consultations",
      value: p.consultationsToday.toLocaleString(),
      hint: 'Appointments scheduled for today (Asia/Colombo)',
    },
    {
      label: 'Total bookings',
      value: p.totalBookings.toLocaleString(),
      hint: 'All-time appointments recorded',
    },
  ]
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [partnerNames, setPartnerNames] = useState<string[]>([])
  const [stats, setStats] = useState<LandingStatCard[]>([])
  const [landingMetricsLoading, setLandingMetricsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchPublicLandingPayload()
        if (cancelled) return
        setPartnerNames(data.partners)
        setStats(buildStatCardsFromPayload(data))
      } catch {
        if (!cancelled) {
          setPartnerNames([])
          setStats([])
        }
      } finally {
        if (!cancelled) setLandingMetricsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-futuristic min-h-screen bg-white text-slate-900 antialiased">
      <a href="#main" className="sr-only skip-link">
        Skip to content
      </a>

      <LandingNavbar />

      <main id="main">
        {/* Hero - full-width shell + slideshow */}
        <section className="relative overflow-hidden border-b border-slate-100/90 bg-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-100"
            aria-hidden
            style={{
              backgroundImage:
                'radial-gradient(ellipse 80% 50% at 10% -10%, rgb(56 189 248 / 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(37 99 235 / 0.08), transparent)',
            }}
          />
          <div
            className={`relative grid gap-12 pb-20 pt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-16 ${shell}`}
          >
            <div className="max-w-2xl xl:max-w-none">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200/90 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                Next-gen care OS
              </motion.div>
              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-[#0f172a] sm:text-5xl xl:text-[3.5rem] xl:leading-[1.05]"
              >
                The operating system for{' '}
                <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-700 bg-clip-text text-transparent">
                  patient-first
                </span>{' '}
                care at planetary scale.
              </motion.h1>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:text-xl"
              >
                Orchestrate triage, telehealth, and secure records in one cohesive
                experience, built for teams that cannot compromise on speed, safety, or
                spectacle.
              </motion.p>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(14,165,233,0.55)] transition hover:brightness-105"
                >
                  Book appointment
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId('#platform')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  <PlayCircle className="h-4 w-4 text-sky-600" aria-hidden />
                  Platform tour
                </button>
              </motion.div>
              <motion.ul
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600"
              >
                {trustBadges.map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {b}
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="relative min-w-0"
            >
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" aria-hidden />
              <div className="absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" aria-hidden />
              <HeroSlideshow slides={heroSlides} reduceMotion={reduceMotion} />
            </motion.div>
          </div>
        </section>

        {/* Partner strip */}
        <section className="border-b border-slate-100 bg-white py-10" aria-label="Trusted by">
          <div className={shell}>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
              Trusted by care teams at
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {landingMetricsLoading ? (
                <span className="text-sm text-slate-400">Loading partners…</span>
              ) : partnerNames.length === 0 ? (
                <span className="text-sm text-slate-400">
                  Partner list is served from the database when the API is reachable.
                </span>
              ) : (
                partnerNames.map((name) => (
                  <span
                    key={name}
                    className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
                  >
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Stats - white canvas, neon-edge cards */}
        <section className="border-y border-slate-100 bg-white py-16">
          <div className={shell}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(landingMetricsLoading
                ? (
                    [
                      'Verified doctors',
                      'Active patients',
                      "Today's consultations",
                      'Total bookings',
                    ] as const
                  ).map((label) => ({ label, value: '…', hint: 'Loading live metrics…' }))
                : stats.length > 0
                  ? stats
                  : (
                      [
                        {
                          label: 'Verified doctors',
                          value: '—',
                          hint: 'Start auth & appointment services to see live counts',
                        },
                        {
                          label: 'Active patients',
                          value: '—',
                          hint: 'Start auth & appointment services to see live counts',
                        },
                        {
                          label: "Today's consultations",
                          value: '—',
                          hint: 'Start auth & appointment services to see live counts',
                        },
                        {
                          label: 'Total bookings',
                          value: '—',
                          hint: 'Start auth & appointment services to see live counts',
                        },
                      ] satisfies LandingStatCard[]
                    )
              ).map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_20px_50px_-18px_rgba(15,23,42,0.08)]"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
                    aria-hidden
                  />
                  <p className="bg-gradient-to-br from-[#0f172a] to-slate-700 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                    {s.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0f172a]">{s.label}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.hint}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 border-b border-slate-100 bg-white py-20">
          <div className={shell}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                From first symptom to coordinated care in three deliberate steps
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Designed to reduce friction for patients while giving clinicians
                structured context before the first hello.
              </p>
            </div>
            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {steps.map((item, i) => (
                <motion.article
                  key={item.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-60px' }}
                  className="relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_0_0_1px_rgba(14,165,233,0.04)] transition hover:border-sky-200/80 hover:shadow-md"
                >
                  <span className="text-xs font-bold tabular-nums text-sky-600">
                    {item.step}
                  </span>
                  <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <item.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Platform grid */}
        <section id="platform" className="scroll-mt-24 py-20">
          <div className={shell}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                  Platform
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                  Everything your care organization needs on one backbone
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Modular capabilities that scale from single-practice pilots to
                  multi-site deployments without sacrificing governance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToId('#testimonials')}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Read customer stories
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {platformFeatures.map((f, i) => (
                <motion.div
                  key={f.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  className={`group rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${f.cardClass}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.iconWrap}`}
                  >
                    <f.Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#0f172a]">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase cards with imagery */}
        <section className="border-y border-slate-100 bg-white py-20">
          <div className={shell}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                Clinical capabilities
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                Depth where it matters: intake, consultation, and documentation
              </h2>
            </div>
            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {showcaseFeatures.map((f, i) => (
                <motion.article
                  key={f.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-50px' }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={f.image}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/50 to-transparent" aria-hidden />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#0f172a] shadow backdrop-blur">
                      <f.icon className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                      Flagship module
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-semibold text-[#0f172a]">{f.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                      {f.description}
                    </p>
                    <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="scroll-mt-24 py-20">
          <div className={shell}>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                  Security & governance
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                  Built for regulated environments from day one
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Security is not a bolt-on checklist. It shapes our architecture,
                  release process, and how we partner with your risk teams.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    { line: 'SOC 2 roadmap support', Icon: ShieldCheck, tone: 'text-sky-600' },
                    { line: 'Granular RBAC & audit exports', Icon: Lock, tone: 'text-blue-600' },
                    { line: 'Pen-test friendly architecture', Icon: Activity, tone: 'text-cyan-600' },
                  ].map(({ line, Icon, tone }) => (
                    <li key={line} className="flex gap-3 text-sm text-slate-700">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 ${tone}`}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-1">
                {securityPoints.map((point, i) => {
                  const PointIcon = point.Icon
                  return (
                    <motion.div
                      key={point.title}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      className={`rounded-2xl border p-6 shadow-[0_0_0_1px_rgba(14,165,233,0.06)] transition hover:shadow-md ${point.cardClass}`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${point.iconWrap}`}
                      >
                        <PointIcon className="h-6 w-6" aria-hidden />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{point.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{point.body}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="scroll-mt-24 border-t border-slate-100 bg-white py-20">
          <div className={shell}>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                Outcomes
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                Teams ship faster care without trading trust
              </h2>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {testimonials.map((t, i) => {
                const QuoteIcon = t.Icon
                return (
                  <motion.blockquote
                    key={t.name}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: '-40px' }}
                    className={`flex h-full flex-col rounded-2xl border p-7 ${t.cardClass}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconWrap}`}
                        aria-hidden
                      >
                        <QuoteIcon className="h-5 w-5" />
                      </div>
                      <div className="flex gap-0.5 text-amber-400" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                    <footer className="mt-6 border-t border-slate-200/80 pt-5">
                      <p className="text-sm font-semibold text-[#0f172a]">{t.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{t.role}</p>
                    </footer>
                  </motion.blockquote>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-24 bg-white py-20">
          <div className={shell}>
            <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                Answers for clinical, operations, and IT stakeholders
              </h2>
            </div>
            <div className="mt-10 space-y-3">
              {faqItems.map((item, idx) => {
                const open = openFaq === idx
                const FaqIcon = item.Icon
                return (
                  <div
                    key={item.q}
                    className={`overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm transition ${item.accent} ${item.bar}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      aria-expanded={open}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/95 shadow-sm ring-1 ${item.iconTone}`}
                      >
                        <FaqIcon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#0f172a]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {open && (
                      <div className="border-t border-slate-200/80 bg-white/85 px-4 py-4 pl-[4.25rem] text-sm leading-relaxed text-slate-600 sm:px-5 sm:pl-[4.5rem]">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            </div>
          </div>
        </section>

        {/* CTA - white canvas, high-contrast inset panel */}
        <section className="border-t border-slate-100 bg-white py-16">
          <div className={shell}>
            <div className="relative overflow-hidden rounded-3xl border border-sky-200/50 bg-white p-8 shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_28px_80px_-28px_rgba(14,165,233,0.35)] md:flex md:items-center md:justify-between md:gap-10 md:p-12">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl"
                aria-hidden
              />
              <div className="relative max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                  Get started
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">
                  Ready to modernize intake, visits, and records?
                </h2>
                <p className="mt-3 text-slate-600">
                  Schedule a tailored walkthrough or spin up a pilot workspace in days, not
                  quarters.
                </p>
              </div>
              <div className="relative mt-8 flex flex-wrap gap-3 md:mt-0">
                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(14,165,233,0.5)] hover:brightness-105"
                >
                  Talk to sales
                </button>
                <Link
                  to="/register"
                  className="rounded-xl border-2 border-[#0f172a] bg-white px-6 py-3.5 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50"
                >
                  Create patient account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - same gradient as Book appointment / navbar */}
      <footer className={`border-t border-white/25 ${brandGradientBar}`}>
        <div className={`${shell} py-14`}>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white ring-1 ring-white/30">
                  <Activity className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-base font-semibold text-white">MediSmart AI</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                Enterprise-grade digital care infrastructure, bridging patients,
                clinicians, and compliance teams.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-100">
                Product
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/90">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('platform')}
                    className="hover:text-white hover:underline"
                  >
                    Platform
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('security')}
                    className="hover:text-white hover:underline"
                  >
                    Security
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToId('faq')}
                    className="hover:text-white hover:underline"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-100">
                Company
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/90">
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-100">
                Legal
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/90">
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:underline">
                    Cookie settings
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/25 pt-8 text-xs text-white/75 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} MediSmart AI. All rights reserved.</p>
            <p className="max-w-md md:text-right">
              This page describes a demo product. Clinical decisions always belong to licensed professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

