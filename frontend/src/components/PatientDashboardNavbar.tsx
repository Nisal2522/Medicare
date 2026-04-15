import { Activity, Bell, Menu, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  dashboardBrandInset,
  dashboardNavbarGridClass,
} from './dashboardShell'
import { brandButtonClass } from './LandingNavbar'
import { useNotifications } from '../context/NotificationContext'

type Props = {
  onMenuClick?: () => void
  menuOpen?: boolean
  portalSubtitle?: string
  /** Patient dashboard shows the booking CTA; hide on doctor portal. */
  showFindDoctor?: boolean
}

const notificationButtonClass =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/90 text-sky-700 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50'

function NotificationsButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    dismissNotification,
    clearReadNotifications,
    clearNotifications,
  } = useNotifications()

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open && unreadCount > 0) {
      void markAllRead()
    }
  }, [open, unreadCount, markAllRead])

  useEffect(() => {
    if (open) return
    if (!notifications.length) return
    // User has viewed notifications; clear the seen rows.
    void clearReadNotifications()
  }, [open, notifications.length, clearReadNotifications])

  const items = useMemo(() => notifications.slice(0, 8), [notifications])

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        className={notificationButtonClass}
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-[70] mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-2xl">
          <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                {items.length} items
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Opened notifications auto-clear after viewing.
            </p>
          </div>
          <div className="flex items-center justify-end border-b border-sky-100 px-3 py-2">
            <button
              type="button"
              className="text-xs font-semibold text-sky-700 hover:underline"
              onClick={() => void clearNotifications()}
            >
              Clear all
            </button>
          </div>
          {loading ? (
            <p className="px-3 py-2 text-xs text-slate-500">Syncing notifications...</p>
          ) : null}
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Bell className="mx-auto h-6 w-6 text-slate-300" aria-hidden />
              <p className="mt-2 text-sm font-medium text-slate-600">
                No notifications
              </p>
              <p className="mt-1 text-xs text-slate-500">
                New updates will appear here in real-time.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-slate-100 px-3 py-2.5 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void dismissNotification(n.id)}
                    className="w-full rounded-lg px-1 text-left transition hover:bg-sky-50"
                    title="Mark as seen and remove"
                  >
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {n.message || '—'}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(n.ts).toLocaleString('en-LK', {
                        timeZone: 'Asia/Colombo',
                      })}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
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
