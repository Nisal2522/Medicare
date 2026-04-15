import { isAxiosError } from 'axios'
import {
  CloudDownload,
  Eye,
  FileImage,
  FileText,
  FolderOpen,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchPatientRecords, type MedicalRecordRow } from '../../api/patientApi'
import { useAuth } from '../../context/AuthContext'

type ReportCategory = 'all' | 'blood' | 'imaging' | 'prescription' | 'other'

const CATEGORY_META: Record<
  Exclude<ReportCategory, 'all'>,
  { label: string; badgeClass: string }
> = {
  prescription: {
    label: 'Prescription',
    badgeClass:
      'border-violet-300/60 bg-violet-500/15 text-violet-900 ring-violet-400/20',
  },
  blood: {
    label: 'Blood tests',
    badgeClass:
      'border-rose-300/60 bg-rose-500/12 text-rose-900 ring-rose-400/20',
  },
  imaging: {
    label: 'Imaging',
    badgeClass:
      'border-cyan-300/60 bg-cyan-500/12 text-cyan-900 ring-cyan-400/20',
  },
  other: {
    label: 'General',
    badgeClass:
      'border-slate-300/60 bg-slate-500/10 text-slate-800 ring-slate-400/15',
  },
}

const FILTER_CHIPS: { id: ReportCategory; label: string }[] = [
  { id: 'all', label: 'All files' },
  { id: 'blood', label: 'Blood tests' },
  { id: 'imaging', label: 'X-rays & imaging' },
  { id: 'prescription', label: 'Prescriptions' },
  { id: 'other', label: 'Other' },
]

function inferCategory(r: MedicalRecordRow): Exclude<ReportCategory, 'all'> {
  const rc = r.reportCategory?.toLowerCase()
  if (rc === 'blood') return 'blood'
  if (rc === 'imaging') return 'imaging'
  if (rc === 'prescription' || r.type === 'prescription') return 'prescription'
  if (rc === 'general') return 'other'
  const blob = `${r.title} ${r.fileName} ${r.specialty ?? ''}`.toLowerCase()
  if (
    blob.includes('blood') ||
    blob.includes('cbc') ||
    blob.includes('fbs') ||
    blob.includes('lipid') ||
    blob.includes('hba1c') ||
    blob.includes('lab report') ||
    blob.includes('laboratory')
  ) {
    return 'blood'
  }
  if (
    blob.includes('x-ray') ||
    blob.includes('xray') ||
    blob.includes('mri') ||
    blob.includes('ct scan') ||
    blob.includes('ultrasound') ||
    blob.includes('imaging') ||
    blob.includes('radiology')
  ) {
    return 'imaging'
  }
  return 'other'
}

function fileKind(fileName: string): 'pdf' | 'image' | 'doc' {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(lower)) return 'image'
  return 'doc'
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-LK', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const glassPanel =
  'rounded-2xl border border-white/60 bg-white/40 shadow-[0_8px_40px_-16px_rgba(14,165,233,0.22)] backdrop-blur-xl backdrop-saturate-150'

const actionBtn =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/50 bg-white/50 text-sky-700 shadow-sm transition hover:border-sky-400/60 hover:bg-sky-50 hover:text-sky-900 hover:shadow-[0_0_20px_-6px_rgba(56,189,248,0.55)]'

function FileTypeIcon({ kind }: { kind: 'pdf' | 'image' | 'doc' }) {
  if (kind === 'pdf') {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/90 to-rose-700/90 text-white shadow-lg shadow-red-500/25 ring-2 ring-white/40">
        <span className="text-xs font-black tracking-tighter">PDF</span>
      </span>
    )
  }
  if (kind === 'image') {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-white/40">
        <FileImage className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </span>
    )
  }
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-500/20 ring-2 ring-white/40">
      <FileText className="h-7 w-7" strokeWidth={1.75} aria-hidden />
    </span>
  )
}

export default function DoctorPatientReportsPage() {
  const { token } = useAuth()
  const { patientId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')

  const [rows, setRows] = useState<MedicalRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ReportCategory>('all')
  const [preview, setPreview] = useState<{
    url: string
    title: string
    kind: 'pdf' | 'image' | 'doc'
  } | null>(null)

  const load = useCallback(async () => {
    if (!token || !patientId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPatientRecords(patientId, token, {
        appointmentId: appointmentId ?? undefined,
      })
      setRows(data)
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 403) {
        setError('Access denied. Approve this patient appointment to view reports.')
      } else {
        setError(
          isAxiosError(e)
            ? 'Could not load patient medical records.'
            : 'Something went wrong',
        )
      }
    } finally {
      setLoading(false)
    }
  }, [token, patientId, appointmentId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      const cat = inferCategory(r)
      if (category !== 'all' && cat !== category) return false
      if (!q) return true
      const dateStr = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString('en-LK', {
            timeZone: 'Asia/Colombo',
          })
        : ''
      const hay = `${r.title} ${r.fileName} ${r.doctorName} ${dateStr}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, query, category])

  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30"
          >
            <FolderOpen className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Patient medical reports
            </h1>
            <p className="text-sm text-slate-500">
              Patient ID: <span className="font-mono">{patientId}</span>
              {appointmentId ? (
                <>
                  {' '}
                  · Appointment: <span className="font-mono">{appointmentId}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <p
          className={`${glassPanel} border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-950`}
        >
          {error}
        </p>
      ) : null}

      <div className={`${glassPanel} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600/70"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by document name, doctor, or date..."
            className="w-full rounded-xl border border-sky-200/60 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-inner outline-none ring-0 backdrop-blur-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:shadow-[0_0_20px_-8px_rgba(56,189,248,0.45)]"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="shrink-0 text-sm text-slate-500">
            {filtered.length} of {rows.length} file{rows.length === 1 ? '' : 's'}
          </p>
          <Link
            to="/dashboard/doctor/appointments"
            className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-50"
          >
            Back to appointments
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((c) => {
          const active = category === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-300/40'
                  : 'border border-sky-200/70 bg-white/50 text-slate-700 backdrop-blur-sm hover:border-sky-300 hover:bg-white/80'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-hidden />
          Loading patient reports...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`${glassPanel} flex flex-col items-center justify-center py-16 text-center`}
        >
          <FolderOpen className="h-12 w-12 text-sky-400/80" aria-hidden />
          <p className="mt-4 font-medium text-slate-700">No reports found</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            This patient has no uploaded files in the selected filter.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const cat = inferCategory(r)
            const meta = CATEGORY_META[cat]
            const kind = fileKind(r.fileName)
            return (
              <li key={r.id}>
                <article
                  className={`${glassPanel} flex h-full flex-col p-4 transition hover:border-sky-300/70 hover:shadow-[0_12px_40px_-16px_rgba(14,165,233,0.28)] sm:p-5`}
                >
                  <div className="flex gap-4">
                    <FileTypeIcon kind={kind} />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                        {r.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{r.fileName}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Shared by {r.doctorName || '—'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() =>
                        setPreview({
                          url: r.fileUrl,
                          title: r.title,
                          kind,
                        })
                      }
                      aria-label="Preview"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() => {
                        window.open(r.fileUrl, '_blank', 'noopener,noreferrer')
                      }}
                      aria-label="Download"
                      title="Download"
                    >
                      <CloudDownload className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {preview ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="line-clamp-1 pr-4 text-sm font-semibold text-slate-900">
                {preview.title}
              </h2>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {preview.kind === 'image' ? (
              <div className="max-h-[80vh] overflow-auto bg-slate-100 p-4">
                <img
                  src={preview.url}
                  alt={preview.title}
                  className="mx-auto max-h-[72vh] w-auto rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ) : (
              <iframe
                src={preview.url}
                title={preview.title}
                className="h-[75vh] w-full"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
