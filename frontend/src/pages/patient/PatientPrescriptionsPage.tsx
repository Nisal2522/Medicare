import { isAxiosError } from 'axios'
import { jsPDF } from 'jspdf'
import { Download, Eye, Loader2, Pill, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  fetchPatientPrescriptionDetail,
  fetchPatientIssuedPrescriptions,
  type PatientPrescriptionRow,
} from '../../api/appointmentApi'
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
  const [rows, setRows] = useState<PatientPrescriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<PatientPrescriptionRow | null>(null)
  const [detail, setDetail] = useState<ReturnType<typeof buildEmptyDetail> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  function buildEmptyDetail() {
    return {
      diagnosis: '',
      symptoms: '',
      clinicalNotes: '',
      specialAdvice: '',
      labTests: '',
      followUpDate: undefined as string | undefined,
      medicines: [] as Array<{
        name: string
        dosage: string
        frequency?: string
        duration: string
        instructions?: string
      }>,
      doctorName: undefined as string | undefined,
    }
  }

  const openDetails = async (row: PatientPrescriptionRow) => {
    if (!token) return
    try {
      setSelected(row)
      setDetailLoading(true)
      setDetailError(null)
      setDetail(null)
      const data = await fetchPatientPrescriptionDetail(token, row.id)
      setDetail({
        diagnosis: data.diagnosis,
        symptoms: data.symptoms ?? '',
        clinicalNotes: data.clinicalNotes ?? '',
        specialAdvice: data.specialAdvice ?? '',
        labTests: data.labTests ?? '',
        followUpDate: data.followUpDate,
        medicines: data.medicines,
        doctorName: data.doctorName || row.doctorName,
      })
    } catch {
      setDetailError('Could not load prescription details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDownload = async (prescriptionId: string) => {
    if (!token) return
    try {
      setDownloadingId(prescriptionId)
      const detail = await fetchPatientPrescriptionDetail(token, prescriptionId)
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 36
      const contentWidth = pageWidth - margin * 2
      let y = margin

      const drawLabelValue = (label: string, value: string, top: number) => {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(10)
        doc.text(label, margin + 14, top)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(11)
        const wrapped = doc.splitTextToSize(value || '—', contentWidth - 120) as string[]
        doc.text(wrapped, margin + 130, top)
        return Math.max(16, wrapped.length * 14)
      }

      const drawRoundedCard = (top: number, height: number, fill: [number, number, number]) => {
        doc.setDrawColor(fill[0], fill[1], fill[2])
        doc.setFillColor(fill[0], fill[1], fill[2])
        doc.roundedRect(margin, top, contentWidth, height, 10, 10, 'FD')
      }

      const ensureSpace = (need: number) => {
        if (y + need <= pageHeight - margin) return
        doc.addPage()
        y = margin
      }

      // Top accent bar
      doc.setFillColor(30, 64, 175)
      doc.roundedRect(margin, y, contentWidth, 86, 12, 12, 'F')
      doc.setFillColor(56, 189, 248)
      doc.roundedRect(margin + contentWidth - 120, y, 120, 86, 12, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(23)
      doc.text('Medical Prescription', margin + 18, y + 35)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text('Digitally generated patient copy', margin + 18, y + 55)
      y += 102

      // Meta card
      ensureSpace(90)
      drawRoundedCard(y, 86, [241, 245, 249])
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`Prescription ID: ${detail.id}`, margin + 14, y + 26)
      doc.text(`Appointment ID: ${detail.appointmentId}`, margin + 14, y + 44)
      doc.text(`Issued Date: ${formatDate(detail.createdAt)}`, margin + 14, y + 62)
      y += 102

      // Clinical details section
      ensureSpace(170)
      drawRoundedCard(y, 160, [248, 250, 252])
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Clinical Summary', margin + 14, y + 24)
      let lineTop = y + 44
      lineTop += drawLabelValue('Diagnosis', detail.diagnosis || '—', lineTop)
      lineTop += drawLabelValue('Symptoms', detail.symptoms || '—', lineTop)
      lineTop += drawLabelValue('Notes', detail.clinicalNotes || '—', lineTop)
      lineTop += drawLabelValue('Advice', detail.specialAdvice || '—', lineTop)
      lineTop += drawLabelValue('Lab Tests', detail.labTests || '—', lineTop)
      drawLabelValue('Follow-up', formatDate(detail.followUpDate), lineTop)
      y += 176

      // Medicines section
      const medicineRows = detail.medicines.length
        ? detail.medicines
        : [{ name: 'No medicines listed', dosage: '—', duration: '—' }]
      const medHeight = 42 + medicineRows.length * 36
      ensureSpace(medHeight + 30)
      drawRoundedCard(y, medHeight, [238, 242, 255])
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text('Medication Plan', margin + 14, y + 24)

      let medY = y + 46
      medicineRows.forEach((m, i) => {
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(margin + 12, medY - 16, contentWidth - 24, 28, 8, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text(`${i + 1}. ${m.name}`, margin + 20, medY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        const meta = `${m.dosage} | ${m.frequency || '—'} | ${m.duration}${m.instructions ? ` | ${m.instructions}` : ''}`
        const wrappedMeta = doc.splitTextToSize(meta, contentWidth - 210) as string[]
        doc.text(wrappedMeta[0] || '—', margin + 210, medY)
        medY += 34
      })
      y += medHeight + 12

      // Footer note
      ensureSpace(40)
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y, pageWidth - margin, y)
      y += 16
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('This document is generated electronically from the medical platform.', margin, y)

      doc.save(`prescription-${detail.id}.pdf`)
    } catch {
      setError('Could not download prescription.')
    } finally {
      setDownloadingId(null)
    }
  }

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
        const data = await fetchPatientIssuedPrescriptions(token, { limit: 50 })
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
                  <p className="font-semibold text-slate-900">{r.diagnosis}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {r.medicinesSummary || 'Medicines listed in prescription'}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Doctor: <span className="font-medium">{r.doctorName || 'Not available'}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Issued: {formatDate(r.createdAt)}
                    {r.followUpDate ? ` · Follow-up: ${formatDate(r.followUpDate)}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-xs text-slate-500">Appointment: {r.appointmentId}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void openDetails(r)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    View details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDownload(r.id)
                    }}
                    disabled={downloadingId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(selected || detailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Prescription details</h3>
                <p className="text-xs text-slate-500">{selected ? selected.id : ''}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  setDetail(null)
                  setDetailError(null)
                }}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50"
                aria-label="Close details"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto bg-slate-50 px-5 py-4 text-sm">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                  Loading details...
                </div>
              ) : detailError ? (
                <p className="py-8 text-center text-sm text-rose-600">{detailError}</p>
              ) : selected && detail ? (
                <>
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-700">Doctor:</span>{' '}
                      {detail.doctorName || selected.doctorName || 'Not available'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Issued:</span>{' '}
                      {formatDate(selected.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Follow-up:</span>{' '}
                      {formatDate(detail.followUpDate)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Appointment:</span>{' '}
                      <span className="font-mono text-xs">{selected.appointmentId}</span>
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                    <p>
                      <span className="font-semibold text-slate-700">Diagnosis:</span>{' '}
                      {detail.diagnosis || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Symptoms:</span>{' '}
                      {detail.symptoms || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Clinical Notes:</span>{' '}
                      {detail.clinicalNotes || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Special Advice:</span>{' '}
                      {detail.specialAdvice || '—'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Lab Tests:</span>{' '}
                      {detail.labTests || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-800">Medicines</p>
                    {detail.medicines.length === 0 ? (
                      <p className="mt-2 text-slate-500">No medicines listed.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {detail.medicines.map((m, i) => (
                          <li key={`${m.name}-${i}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="font-medium text-slate-900">{m.name}</p>
                            <p className="text-xs text-slate-600">
                              {m.dosage} · {m.frequency || 'No frequency'} · {m.duration}
                            </p>
                            {m.instructions ? (
                              <p className="mt-1 text-xs text-slate-500">Instructions: {m.instructions}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
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
