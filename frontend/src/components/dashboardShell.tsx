import { brandButtonClass } from './LandingNavbar'

/**
 * White sidebar (matches dashboard navbar). Active row uses primary blue CTA gradient.
 */
export const dashboardAsideWhite =
  'flex min-h-0 flex-col border-r border-sky-100/90 bg-white shadow-[2px_0_24px_-18px_rgba(14,165,233,0.18)]'

/** Extra horizontal space + comfortable padding */
export const dashboardAsideWidthMobile = 'w-[min(100%,17.5rem)]'
export const dashboardAsideWidthMd = 'md:w-60 md:shrink-0 lg:w-64'

export const dashboardNavRow =
  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium leading-snug transition duration-150 ease-out'

/**
 * Navbar desktop grid: column 1 must match `dashboardAsideWidthMd` (15rem / 16rem).
 */
export const dashboardNavbarGridClass =
  'md:grid md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)] md:items-center md:gap-0'

/**
 * Inset so the logo lines up with the first sidebar nav icon.
 */
export const dashboardBrandInset = 'pl-[1.625rem] pr-3'

/** Nav links on white sidebar — active matches navbar CTA gradient. */
export function dashboardNavClassOnWhite(isActive: boolean): string {
  return isActive
    ? `${brandButtonClass} ring-1 ring-sky-400/40 shadow-lg shadow-sky-500/25`
    : 'text-slate-600 ring-1 ring-transparent hover:bg-sky-50/90 hover:text-slate-900'
}

export const dashboardSidebarFooterWhite =
  'shrink-0 border-t border-sky-100/90 bg-slate-50/80 p-3 backdrop-blur-sm'

/** Reusable content card (glass-lite) */
export const dashboardCardClass =
  'rounded-2xl border border-slate-200/70 bg-white shadow-card-soft'

/** Mobile drawer starts below sticky navbar (~4.5rem). */
export const dashboardSidebarMobileTop = 'top-[4.5rem]'
