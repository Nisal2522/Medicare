import {
  CalendarDays,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Pill,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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
import { fetchDoctorById } from '../api/doctorApi'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8'

const iconProps = {
  className: 'h-4 w-4 shrink-0 text-current opacity-90',
  strokeWidth: 1.75 as const,
}

function userInitial(name?: string | null, email?: string | null): string {
  const n = name?.trim()
  if (n) return n[0]!.toUpperCase()
  const e = email?.trim()
  if (e) return e[0]!.toUpperCase()
  return '?'
}

export default function DoctorLayout() {
  const { user, token, logout, updateUser } = useAuth()
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

  useEffect(() => {
    if (!token || !user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const d = await fetchDoctorById(user.id)
        if (!cancelled && d.profilePicture?.trim()) {
          updateUser({ avatarUrl: d.profilePicture })
        }
      } catch {
        /* keep existing cached avatar */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, user?.id, updateUser])

  const closeMobileSidebar = () => setMobileSidebarOpen(false)

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 text-slate-900">
      <div className="shrink-0">
        <PatientDashboardNavbar
          portalSubtitle="Doctor portal"
          showFindDoctor={false}
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
            <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:hidden">
              Menu
            </p>
            <NavLink
              to="/dashboard/doctor"
              end
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <LayoutDashboard {...iconProps} aria-hidden />
              Dashboard
            </NavLink>
            <NavLink
              to="/dashboard/doctor/appointments"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <CalendarDays {...iconProps} aria-hidden />
              Appointments
            </NavLink>
            <NavLink
              to="/dashboard/doctor/availability"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <ClipboardList {...iconProps} aria-hidden />
              Availability
            </NavLink>
            <NavLink
              to="/dashboard/doctor/prescriptions"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <Pill {...iconProps} aria-hidden />
              Prescriptions
            </NavLink>
            <NavLink
              to="/dashboard/doctor/profile"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `${dashboardNavRow} ${dashboardNavClassOnWhite(isActive)}`
              }
            >
              <UserRound {...iconProps} aria-hidden />
              My Profile
            </NavLink>

            <div className="mt-3 border-t border-sky-100/90 pt-3 md:hidden">
              <p className="mb-0.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Quick links
              </p>
              <NavLink
                to="/"
                onClick={closeMobileSidebar}
                className={`${dashboardNavRow} ${dashboardNavClassOnWhite(false)}`}
              >
                <Home {...iconProps} aria-hidden />
                Home
              </NavLink>
            </div>
          </nav>

          <div className={dashboardSidebarFooterWhite}>
            <div className="flex items-center gap-3 px-0.5">
              <div
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-800 ring-2 ring-white shadow-sm"
                aria-hidden
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitial(user?.fullName, user?.email)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.fullName?.trim() || 'Doctor'}
                </p>
                <span className="mt-0.5 inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                  Doctor
                </span>
              </div>
            </div>
            <p className="mt-2 truncate px-0.5 text-[11px] text-slate-500">
              {user?.email}
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

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className={shell}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
