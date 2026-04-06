/**
 * MediSmart unified UI tokens (sky / blue system, cards, typography).
 * Use across patient pages, auth, and standalone routes for one consistent look.
 */
export { brandButtonClass as appCtaClass } from '../components/LandingNavbar'
export { dashboardCardClass as appCardClass } from '../components/dashboardShell'

/** Full-width content column inside PatientLayout shell */
export const appPageWrap = 'w-full min-w-0 space-y-8 pb-10'

/** Top page title block (matches Profile / Dashboard) */
export const appPageHeader =
  'w-full border-b border-slate-200/70 pb-8'

export const appPageTitle =
  'text-3xl font-bold tracking-tight text-slate-900'

export const appPageSubtitle = 'mt-2 text-base text-slate-600'

export const appSectionEyebrow =
  'text-xs font-semibold uppercase tracking-widest text-sky-700'

export const appLink =
  'font-semibold text-sky-700 underline-offset-2 hover:underline'

export const appErrorBanner =
  'rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm'

export const appTableWrap =
  'overflow-x-auto rounded-2xl border border-slate-200/70 bg-white shadow-card-soft'

export const appTableHeadRow =
  'border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500'

export const appEmptyStateBox =
  'flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-200/80 bg-sky-50/40 px-8 py-16 text-center'
