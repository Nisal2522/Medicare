import type { ReactNode } from 'react'
import { LandingNavbar } from '../LandingNavbar'

type Props = {
  title: string
  subtitle?: string
  backgroundImageUrl: string
  authPage?: 'login' | 'register'
  compactCard?: boolean
  children: ReactNode
}

export function AuthShell({
  title,
  subtitle,
  backgroundImageUrl,
  authPage,
  compactCard,
  children,
}: Props) {
  const showSubtitle = Boolean(subtitle?.trim())
  const cardPad = compactCard ? 'px-5 py-5 sm:px-6 sm:py-6' : 'p-8 sm:p-10'
  const rightPadY = compactCard ? 'py-8 sm:py-10' : 'py-10 sm:py-14'

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col bg-slate-100">
      <header className="relative z-20 shrink-0">
        <LandingNavbar activeAuth={authPage} />
      </header>

      {/* Main: column on mobile, row on lg — both panes flex for equal height */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
        {/* Left pane — image */}
        <div className="relative flex min-h-[32vh] w-full shrink-0 overflow-hidden lg:min-h-0 lg:min-w-0 lg:flex-1 lg:basis-0">
          <div
            className="absolute inset-0 bg-cover bg-left bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-slate-950/25 to-slate-950/10 lg:from-slate-950/45 lg:via-slate-900/20 lg:to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            aria-hidden
            style={{
              backgroundImage:
                'radial-gradient(ellipse 90% 70% at 15% 20%, rgb(56 189 248 / 0.18), transparent)',
            }}
          />
        </div>

        {/* Right pane — card centered with flex */}
        <div
          className={`flex min-h-0 w-full flex-1 basis-0 flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50/40 px-5 sm:px-10 ${rightPadY}`}
        >
          <div
            className={`isolate w-full max-w-md shrink-0 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 ${cardPad} shadow-card-soft backdrop-blur-md [transform:translateZ(0)]`}
          >
            <div className="flex flex-col gap-6">
              <div className="shrink-0">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                {showSubtitle ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-6">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
