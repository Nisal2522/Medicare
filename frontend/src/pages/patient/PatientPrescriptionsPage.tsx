import { isAxiosError } from 'axios'
import { ExternalLink, Loader2, Pill } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  fetchPatientPrescriptions,
  type MedicalRecordRow,
} from '../../api/patientApi'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'
import {
  appPageHeader,
  appPageTitle,
  appPageWrap,
  appSectionEyebrow,
} from '../../lib/uiTheme'

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function PatientPrescriptionsPage() {
  const { user, token } = useAuth()
  const [rows, setRows] = useState<MedicalRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPatientPrescriptions(user.id, token)
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e)
              ? 'Could not load prescriptions.'
              : 'Something went wrong.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, token])

  return (
    <div className={appPageWrap}>
      <header className={appPageHeader}>
        <p className={appSectionEyebrow}>Medical records</p>
        <h1 className={`mt-2 flex items-center gap-2 ${appPageTitle}`}>
          <Pill className="h-8 w-8 text-violet-600" aria-hidden />
          Prescriptions
        </h1>
      </header>

      <div className={`${dashboardCardClass} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-hidden />
            Loading prescriptions…
          </div>
        ) : error ? (
          <p className="py-12 text-center text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No prescriptions on file yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {r.doctorName}
                    {r.specialty ? ` · ${r.specialty}` : null}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(r.createdAt)} · {r.fileName}
                  </p>
                </div>
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 transition hover:bg-violet-100"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Open
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
