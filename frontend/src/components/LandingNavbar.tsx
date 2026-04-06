import { Activity, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24'

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Stories', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
] as const

/** Same gradient as landing “Book appointment” CTA */
export const brandGradientBar =
  'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_10px_40px_-10px_rgba(14,165,233,0.55)]'

/** Primary actions (navbar / dashboard CTAs) */
export const brandButtonClass =
  'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 transition hover:brightness-105 active:brightness-95'

function scrollToSection(href: string) {
  const id = href.replace('#', '')
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

type Props = {
  /** When set, highlights the current auth page in the right-side actions. */
  activeAuth?: 'login' | 'register'
}

export function LandingNavbar({ activeAuth }: Props) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const onHome = pathname === '/'

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/25 backdrop-blur-md ${brandGradientBar}`}
    >
      <div className={`flex items-center justify-between gap-4 py-3.5 ${shell}`}>
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => {
            if (onHome) window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner ring-1 ring-white/30">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold tracking-tight text-white">
              MediSmart AI
            </span>
            <span className="hidden text-xs font-medium text-sky-100 sm:block">
              Smart healthcare platform
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link) =>
            onHome ? (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                to={{ pathname: '/', hash: link.href.replace('#', '') }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            to="/find-doctor"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Find a doctor
          </Link>
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {activeAuth === 'login' ? (
            <span className="rounded-xl border border-white/60 bg-white/20 px-4 py-2.5 text-sm font-semibold text-white">
              Login
            </span>
          ) : (
            <Link
              to="/login"
              className="rounded-xl border border-white/50 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
            >
              Login
            </Link>
          )}
          {activeAuth === 'register' ? (
            <span className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-600 shadow-md">
              Register
            </span>
          ) : (
            <Link
              to="/register"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-600 shadow-md transition hover:bg-sky-50"
            >
              Register
            </Link>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 text-white transition hover:bg-white/10 lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className={`border-t border-white/25 bg-white py-4 shadow-inner lg:hidden ${shell}`}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) =>
              onHome ? (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    scrollToSection(link.href)
                    setMobileOpen(false)
                  }}
                  className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-sky-50"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.href}
                  to={{ pathname: '/', hash: link.href.replace('#', '') }}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-sky-50"
                >
                  {link.label}
                </Link>
              ),
            )}
            <Link
              to="/find-doctor"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Find a doctor
            </Link>
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              {activeAuth === 'login' ? (
                <span className="rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-800">
                  Login
                </span>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Login
                </Link>
              )}
              {activeAuth === 'register' ? (
                <span className={`rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-md ${brandButtonClass}`}>
                  Register
                </span>
              ) : (
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl py-2.5 text-center text-sm font-semibold text-white shadow-md ${brandButtonClass}`}
                >
                  Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
