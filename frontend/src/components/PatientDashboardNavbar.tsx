import { Activity, Bell, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  dashboardBrandInset,
  dashboardNavbarGridClass,
} from './dashboardShell'
import { brandButtonClass } from './LandingNavbar'

type Props = {
  onMenuClick?: () => void
  menuOpen?: boolean
  portalSubtitle?: string
  /** Patient dashboard shows the booking CTA; hide on doctor portal. */
  showFindDoctor?: boolean
}

const notificationButtonClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/90 text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50'

function NotificationsButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      className={`${notificationButtonClass} ${className}`}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

export function PatientDashboardNavbar({
  onMenuClick,
  menuOpen = false,
  portalSubtitle = 'Patient portal',
  showFindDoctor = true,
}: Props) {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-sky-100/90 bg-white shadow-sm shadow-sky-500/5 backdrop-blur-sm">
      {/* Mobile */}
      <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 md:hidden">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/90 text-sky-700 transition hover:bg-sky-50"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={onMenuClick}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center justify-start gap-2.5 text-left"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${brandButtonClass} ring-1 ring-sky-400/30`}
          >
            <Activity className="h-4 w-4 text-white" aria-hidden />
          </span>
          <div className="min-w-0 text-left leading-tight">
            <span className="block truncate text-sm font-semibold tracking-tight text-slate-900">
              MediSmart AI
            </span>
            <span className="block truncate text-[11px] font-medium text-sky-600 sm:text-xs">
              {portalSubtitle}
            </span>
          </div>
        </Link>
        <NotificationsButton />
      </div>

      {/* Desktop — column 1 width matches sidebar */}
      <div
        className={`hidden w-full py-3 sm:py-3.5 md:grid ${dashboardNavbarGridClass}`}
      >
        <div className="flex min-w-0 items-center border-r border-sky-100/90">
          <Link
            to="/"
            className={`flex min-w-0 items-center justify-start gap-2.5 text-left ${dashboardBrandInset}`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${brandButtonClass} ring-1 ring-sky-400/30`}
            >
              <Activity className="h-5 w-5 text-white" aria-hidden />
            </span>
            <div className="min-w-0 text-left leading-tight">
              <span className="block truncate text-base font-semibold tracking-tight text-slate-900">
                MediSmart AI
              </span>
              <span className="block truncate text-xs font-medium text-sky-600">
                {portalSubtitle}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 pr-5 sm:pr-6 lg:pr-8 xl:pr-12">
          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="Dashboard shortcuts"
          >
            <Link
              to="/"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
            >
              Home
            </Link>
            {showFindDoctor ? (
              <Link
                to="/find-doctor"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${brandButtonClass}`}
              >
                Find a doctor
              </Link>
            ) : null}
          </nav>

          <NotificationsButton />
        </div>
      </div>
    </header>
  )
}
