const STYLES: Record<string, string> = {
  APPROVED:
    'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80',
  PENDING:
    'bg-violet-50 text-violet-900 ring-1 ring-inset ring-violet-200/80',
  REJECTED: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200/70',
}

function label(raw: string): string {
  if (raw === 'APPROVED') return 'Approved'
  if (raw === 'PENDING') return 'Awaiting doctor'
  if (raw === 'REJECTED') return 'Declined'
  return raw
}

type Props = {
  status: string
  className?: string
}

export function DoctorApprovalChip({ status, className = '' }: Props) {
  const key = status?.trim() || 'PENDING'
  const palette = STYLES[key] ?? STYLES.PENDING
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${palette} ${className}`.trim()}
    >
      {label(key)}
    </span>
  )
}
