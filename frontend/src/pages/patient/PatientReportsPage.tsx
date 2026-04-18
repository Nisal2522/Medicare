import { isAxiosError } from 'axios'
import {
  CloudDownload,
  Eye,
  FileImage,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  deletePatientRecord,
  fetchPatientRecords,
  resolvePatientRecordFileUrl,
  uploadPatientReport,
  type MedicalRecordRow,
} from '../../api/patientApi'
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

export default function PatientReportsPage() {
  const { user, token } = useAuth()
  const [rows, setRows] = useState<MedicalRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ReportCategory>('all')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [preview, setPreview] = useState<{
    url: string
    title: string
    kind: 'pdf' | 'image' | 'doc'
  } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user || !token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPatientRecords(user.id, token)
      setRows(data)
    } catch (e) {
      setError(
        isAxiosError(e)
          ? 'Could not load medical records.'
          : 'Something went wrong',
      )
    } finally {
      setLoading(false)
    }
  }, [user, token])

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

  async function onUploadAttempt(files: FileList | null) {
    if (!files?.length || !token || !user) return
    setUploading(true)
    try {
      const meta =
        uploadTitle.trim() !== ''
          ? { title: uploadTitle.trim() }
          : undefined
      for (const file of Array.from(files)) {
        await uploadPatientReport(token, file, meta)
      }
      toast.success(
        files.length > 1
          ? `${files.length} files uploaded successfully`
          : 'Report uploaded successfully',
      )
      setUploadTitle('')
      await load()
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Upload failed. Try again later.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    onUploadAttempt(e.dataTransfer.files)
  }

  async function handleDeleteRecord(r: MedicalRecordRow) {
    if (!user || !token) return
    const ok = window.confirm(
      `Remove “${r.title}” from your Document Drive? This cannot be undone.`,
    )
    if (!ok) return
    setDeletingId(r.id)
    try {
      await deletePatientRecord(user.id, r.id, token)
      if (preview?.url === resolvePatientRecordFileUrl(r.fileUrl)) {
        setPreview(null)
      }
      toast.success('Document removed')
      await load()
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message
        : undefined
      toast.error(
        typeof msg === 'string' ? msg : 'Could not delete this document',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30`}
          >
            <FolderOpen className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Document Drive
            </h1>
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

      {/* Upload zone */}
      <section
        className={`${glassPanel} border-2 border-dashed px-4 py-8 text-center transition sm:px-8 ${
          dragOver
            ? 'border-cyan-400 bg-cyan-50/50 shadow-[0_0_40px_-12px_rgba(34,211,238,0.45)]'
            : 'border-sky-300/50 hover:border-sky-400/70'
        }`}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="mx-auto mb-5 max-w-md text-left">
          <label
            htmlFor="report-title"
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Document name (optional)
          </label>
          <input
            id="report-title"
            type="text"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="e.g. March lab results"
            disabled={uploading}
            className="mt-1 w-full rounded-xl border border-sky-200/60 bg-white/60 px-3 py-2 text-sm text-slate-900 outline-none backdrop-blur-sm focus:border-sky-400"
          />
        </div>
        <label className={`cursor-pointer ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,image/*,.doc,.docx"
            multiple
            disabled={uploading}
            onChange={(e) => void onUploadAttempt(e.target.files)}
          />
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_0_28px_-6px_rgba(56,189,248,0.65)] ring-4 ring-sky-200/40">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-8 w-8" strokeWidth={2.5} aria-hidden />
            )}
          </span>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {uploading ? 'Uploading…' : 'Upload new report'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Drag &amp; drop files here, or click to browse. PDFs and images are
            supported.
          </p>
        </label>
      </section>

      {/* Search */}
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
            placeholder="Search by document name, doctor, or date…"
            className="w-full rounded-xl border border-sky-200/60 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-inner outline-none ring-0 backdrop-blur-sm transition placeholder:text-slate-400 focus:border-sky-400 focus:shadow-[0_0_20px_-8px_rgba(56,189,248,0.45)]"
          />
        </div>
        <p className="shrink-0 text-sm text-slate-500">
          {filtered.length} of {rows.length} file{rows.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Category filters */}
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
          Syncing your document drive…
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`${glassPanel} flex flex-col items-center justify-center py-16 text-center`}
        >
          <FolderOpen className="h-12 w-12 text-sky-400/80" aria-hidden />
          <p className="mt-4 font-medium text-slate-700">No documents match</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {rows.length === 0
              ? 'When your doctor shares labs or prescriptions, they will appear here.'
              : 'Try another category or clear your search.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const cat = inferCategory(r)
            const meta = CATEGORY_META[cat]
            const kind = fileKind(r.fileName)
            const fileHref = resolvePatientRecordFileUrl(r.fileUrl)
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
                      <h2 className="mt-2 line-clamp-2 text-base font-semibold text-slate-900">
                        {r.title}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {r.fileName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-sky-100/80 pt-4 text-sm">
                    <div className="flex items-start gap-2 text-slate-700">
                      <Stethoscope
                        className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">{r.doctorName}</p>
                        {r.specialty ? (
                          <p className="text-xs text-slate-500">{r.specialty}</p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Uploaded {formatDate(r.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          url: fileHref,
                          title: r.title,
                          kind,
                        })
                      }
                      className={actionBtn}
                      aria-label={`Preview ${r.title}`}
                    >
                      <Eye className="h-4 w-4" aria-hidden />
                    </button>
                    <a
                      href={fileHref}
                      download
                      className={actionBtn}
                      aria-label={`Download ${r.title}`}
                    >
                      <CloudDownload className="h-4 w-4" aria-hidden />
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleDeleteRecord(r)}
                      disabled={deletingId === r.id}
                      className={`${actionBtn} border-rose-200/60 text-rose-700 hover:border-rose-400/60 hover:bg-rose-50 hover:text-rose-900 hover:shadow-[0_0_20px_-6px_rgba(244,63,94,0.45)] disabled:cursor-not-allowed disabled:opacity-50`}
                      aria-label={`Delete ${r.title}`}
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}

      {/* Preview modal */}
      {preview ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          onClick={() => setPreview(null)}
        >
          <div
            className={`${glassPanel} flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden border-sky-200/60 bg-white/85`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-sky-100/90 px-4 py-3 sm:px-5">
              <h2
                id="preview-title"
                className="truncate text-lg font-semibold text-slate-900"
              >
                {preview.title}
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50/50 p-2 sm:p-4">
              {preview.kind === 'image' ? (
                <img
                  src={preview.url}
                  alt=""
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              ) : preview.kind === 'pdf' ? (
                <iframe
                  title={preview.title}
                  src={preview.url}
                  className="h-[70vh] w-full rounded-lg border border-sky-100 bg-white"
                />
              ) : (
                <p className="p-6 text-center text-slate-600">
                  Preview is not available for this file type. Use{' '}
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-700 underline"
                  >
                    open in new tab
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
