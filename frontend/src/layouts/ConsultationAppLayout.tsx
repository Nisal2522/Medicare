import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { Calendar, Home, LayoutDashboard, LogOut, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  dashboardAsideWhite,
  dashboardAsideWidthMd,
  dashboardAsideWidthMobile,
  dashboardNavClassOnWhite,
  dashboardNavRow,
  dashboardSidebarFooterWhite,
  dashboardSidebarMobileTop,
} from '../components/dashboardShell'
import { PatientDashboardNavbar } from '../components/PatientDashboardNavbar'
import { brandButtonClass } from '../components/LandingNavbar'
import { useAuth } from '../context/AuthContext'
import { PatientDashboardFrame } from './PatientDashboardFrame'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-4 sm:px-6 lg:px-8'

const sideIcon = {
  className: 'h-4 w-4 shrink-0 text-current opacity-90',
  strokeWidth: 1.75 as const,
}

/**
 * Wraps video consultation so it renders inside the same shell as the patient or doctor dashboard
 * (not a separate full-viewport Agora page).
 */
export default function ConsultationAppLayout() {
  const { user, logout } = useAuth()

  if (user?.role === 'PATIENT') {
    return (
      <PatientDashboardFrame
        scrollMain={false}
        mainInnerClassName={`pt-2 pb-4 sm:pt-3 sm:pb-6 ${shell}`}
      >
        <Outlet />
      </PatientDashboardFrame>
    )
  }

  if (user?.role === 'DOCTOR') {
    return <DoctorConsultationShell userEmail={user.email} logout={logout} />
  }

  return <Navigate to="/login" replace />
}

function DoctorConsultationShell({
  userEmail,
  logout,
}: {
  userEmail: string
  logout: () => void
}) {
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const close = () => {
      if (mq.matches) setMobileSidebarOpen(false)
    }
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 text-slate-900">
      <div className="shrink-0">
        <PatientDashboardNavbar
          portalSubtitle="Doctor portal · Video call"
          onMenuClick={() => setMobileSidebarOpen((o) => !o)}
          menuOpen={mobileSidebarOpen}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {mobileSidebarOpen ? (
          <button
            type="button"
            className={`fixed inset-x-0 bottom-0 ${dashboardSidebarMobileTop} z-30 bg-slate-900/35 backdrop-blur-[2px] md:hidden`}
            aria-label="Close menu"
            onClick={closeMobileSidebar}
          />
        ) : null}

        <aside
          className={`fixed bottom-0 left-0 z-40 flex ${dashboardSidebarMobileTop} transition-transform duration-200 ease-out md:static md:inset-auto md:z-0 md:h-full md:translate-x-0 ${dashboardAsideWhite} ${dashboardAsideWidthMobile} ${dashboardAsideWidthMd} ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav
            className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-3 pb-3 pt-3"
            aria-label="Doctor"
          >
            <NavLink
              to="/dashboard/doctor"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <LayoutDashboard {...sideIcon} aria-hidden />
              Back to dashboard
            </NavLink>
            <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              This visit
            </p>
            <div
              className={`${dashboardNavRow} ${dashboardNavClassOnWhite(true)} cursor-default`}
            >
              <Calendar {...sideIcon} aria-hidden />
              Live consultation
            </div>
            <div className="mt-3 border-t border-sky-100/90 pt-3 md:hidden">
              <NavLink
                to="/"
                onClick={closeMobileSidebar}
                className={`${dashboardNavRow} ${dashboardNavClassOnWhite(false)}`}
              >
                <Home {...sideIcon} aria-hidden />
                Home
              </NavLink>
              <NavLink
                to="/find-doctor"
                onClick={closeMobileSidebar}
                className={`${dashboardNavRow} ${dashboardNavClassOnWhite(false)}`}
              >
                <Stethoscope {...sideIcon} aria-hidden />
                Find a doctor
              </NavLink>
            </div>
          </nav>

          <div className={dashboardSidebarFooterWhite}>
            <p className="truncate bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text px-1 text-[11px] font-medium text-transparent">
              {userEmail}
            </p>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
              className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${brandButtonClass}`}
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-y-contain">
          <div className={`flex min-h-0 flex-1 flex-col ${shell}`}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
