import { isAxiosError } from 'axios'
import { Loader2, Pill, Search, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchDoctorPrescriptionDetail,
  fetchDoctorPrescriptions,
  type DoctorPrescriptionDetail,
  type DoctorPrescriptionRow,
} from '../../api/appointmentApi'
import { fetchPatientProfile } from '../../api/patientApi'
import { dashboardCardClass } from '../../components/dashboardShell'
import { useAuth } from '../../context/AuthContext'

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'Asia/Colombo',
    })
  } catch {
    return '—'
  }
}

export default function DoctorPrescriptionsPage() {
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<DoctorPrescriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<DoctorPrescriptionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [profileAge, setProfileAge] = useState<string>('—')
  const [profileGender, setProfileGender] = useState<string>('—')

  const openPrescription = async (id: string) => {
    if (!token) return
    try {
      setDetailLoading(true)
      setDetailError(null)
      setProfileAge('—')
      setProfileGender('—')
      const detail = await fetchDoctorPrescriptionDetail(token, id)
      if (detail.patientId) {
        try {
          const p = await fetchPatientProfile(detail.patientId, token)
          if (typeof p.age === 'number') setProfileAge(String(p.age))
          if (p.gender && p.gender.trim()) {
            const prettyGender =
              p.gender === 'prefer-not-to-say'
                ? 'Prefer not to say'
                : p.gender.charAt(0).toUpperCase() + p.gender.slice(1)
            setProfileGender(prettyGender)
          }
        } catch {
          /* keep prescription values / dashes if patient profile unavailable */
        }
      }
      setSelected(detail)
    } catch {
      setDetailError('Could not open prescription details.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setRows([])
      setLoading(false)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchDoctorPrescriptions(token, { q, limit: 40 })
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e)
              ? 'Could not load prescription history.'
              : 'Something went wrong.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [q, token])

  const stats = useMemo(
    () => ({
      total: rows.length,
      followups: rows.filter((r) => Boolean(r.followUpDate)).length,
    }),
    [rows],
  )

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200/60 pb-6">
        <p className="text-sm font-medium text-slate-500">
          {new Intl.DateTimeFormat('en-LK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Colombo',
          }).format(new Date())}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Prescriptions
        </h1>
        <p className="mt-1 max-w-xl text-slate-600">
          Issue structured prescriptions from an active video consultation.
        </p>
      </header>

      <div
        className={`${dashboardCardClass} flex flex-col gap-4 border-t-4 border-t-violet-500 p-6 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Pill className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-slate-900">During a visit</p>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Open a confirmed appointment, start the video room, and use the prescription
              panel there to add diagnosis and medicines. They are stored against the
              booking and visible to the patient when wired to their drive.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/doctor/appointments"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105"
        >
          <Video className="h-4 w-4" aria-hidden />
          Go to appointments
        </Link>
      </div>

      <div className={`${dashboardCardClass} space-y-4 p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Prescription history</h2>
            <p className="mt-1 text-sm text-slate-600">
              Recent prescriptions issued by you.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900">
              Total: {stats.total}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">
              Follow-ups: {stats.followups}
            </span>
          </div>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by patient, diagnosis, medicine..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-sky-300"
          />
        </label>
        <p className="text-xs text-slate-500">
          Tip: Double-click a prescription row to view full details.
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
            Loading prescriptions...
          </div>
        ) : error ? (
          <p className="py-10 text-center text-sm text-rose-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No prescriptions found for your search.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Diagnosis</th>
                  <th className="px-4 py-3 font-semibold">Medicines</th>
                  <th className="px-4 py-3 font-semibold">Follow-up</th>
                  <th className="px-4 py-3 font-semibold">Appointment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer align-top transition hover:bg-slate-50"
                    onDoubleClick={() => {
                      void openPrescription(r.id)
                    }}
                  >
                    <td className="px-4 py-3 text-slate-700">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-800">
                      <p className="font-medium">{r.patientName || '—'}</p>
                      <p className="text-xs text-slate-500">{r.patientEmail || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.diagnosis || '—'}</td>
                    <td className="max-w-[360px] px-4 py-3 text-slate-700">
                      <p className="line-clamp-2">{r.medicinesSummary || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(r.followUpDate)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {r.appointmentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(selected || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.55)]">
            <div className="relative overflow-hidden border-b border-slate-100 px-6 py-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 opacity-95" />
              <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-cyan-300/30 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-14 h-40 w-40 rounded-full bg-violet-300/25 blur-2xl" />
              <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100/90">
                  Doctor view
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Prescription details
                </h3>
                {selected ? (
                  <p className="text-sm text-sky-100">
                    {selected.id} · {formatDate(selected.createdAt)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setDetailError(null)
                  setProfileAge('—')
                  setProfileGender('—')
                }}
                className="rounded-xl border border-white/30 bg-white/10 p-1.5 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-6 py-5 text-sm">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                  Loading prescription...
                </div>
              ) : detailError ? (
                <p className="py-8 text-center text-sm text-rose-600">{detailError}</p>
              ) : selected ? (
                <>
                  <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-700">Patient:</span>{' '}
                      {selected.patientName || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Email:</span>{' '}
                      {selected.patientEmail || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Age:</span>{' '}
                      {profileAge !== '—' ? profileAge : selected.patientAge || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Gender:</span>{' '}
                      {profileGender !== '—' ? profileGender : selected.patientGender || '—'}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-slate-700">Appointment:</span>{' '}
                      <span className="font-mono text-xs">{selected.appointmentId}</span>
                    </p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <p>
                      <span className="font-semibold text-slate-700">Diagnosis:</span>{' '}
                      {selected.diagnosis || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Symptoms:</span>{' '}
                      {selected.symptoms || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Clinical notes:</span>{' '}
                      {selected.clinicalNotes || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Special advice:</span>{' '}
                      {selected.specialAdvice || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Lab tests:</span>{' '}
                      {selected.labTests || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Follow-up:</span>{' '}
                      {formatDate(selected.followUpDate)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-base font-semibold text-slate-800">Medicines</p>
                    {selected.medicines.length ? (
                      <ul className="space-y-2">
                        {selected.medicines.map((m, idx) => (
                          <li
                            key={`${m.name}-${idx}`}
                            className="rounded-xl border border-sky-100 bg-gradient-to-r from-white to-sky-50/60 p-3"
                          >
                            <p className="font-medium text-slate-800">{m.name}</p>
                            <p className="text-xs text-slate-600">
                              {m.dosage} · {m.frequency || '—'} · {m.duration}
                              {m.instructions ? ` · ${m.instructions}` : ''}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No medicines listed.</p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
