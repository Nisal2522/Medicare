const CHIP_BY_STATUS: Record<string, string> = {
  CONFIRMED:
    'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200/70',
  PENDING: 'bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200/70',
  PENDING_PAYMENT:
    'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200/70',
  CANCELLED:
    'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200/70',
  COMPLETED:
    'bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200/70',
}

const DEFAULT_CHIP =
  'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/70'

function labelForStatus(raw: string): string {
  if (!raw.trim()) return '—'
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type Props = {
  status: string
  className?: string
}

export function AppointmentStatusChip({ status, className = '' }: Props) {
  const key = status?.trim() ?? ''
  const palette = CHIP_BY_STATUS[key] ?? DEFAULT_CHIP
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${palette} ${className}`.trim()}
    >
      {labelForStatus(key)}
    </span>
  )
}
