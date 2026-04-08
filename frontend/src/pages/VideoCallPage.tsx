import { isAxiosError } from 'axios'
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Pill,
  Printer,
  Video,
  VideoOff,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AgoraRTC, {
  AgoraRTCProvider,
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
} from 'agora-rtc-react'
import { issuePrescription, type MedicineLine } from '../api/appointmentApi'
import { fetchTelecomToken } from '../api/telecomApi'
import { useAuth } from '../context/AuthContext'

const glassBar =
  'rounded-[999px] border border-white/20 bg-white/10 px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150'
const glassPip =
  'overflow-hidden rounded-2xl border border-white/25 bg-black/30 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/15 backdrop-blur-md'

type GlassSessionProps = {
  appointmentId: string
  authToken: string
  userFullName: string
  userRole: string
  onOpenPrescription: () => void
  onLeaveComplete: () => void
}

function friendlyDeviceError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes('not_readable') || msg.includes('notreadableerror')) {
    return 'Camera is busy or blocked by another app. Close Zoom/Meet/Teams, then re-open this call.'
  }
  if (msg.includes('notallowederror') || msg.includes('permission denied')) {
    return 'Camera or microphone permission is blocked. Allow access in browser site settings and retry.'
  }
  if (msg.includes('notfounderror') || msg.includes('requested device not found')) {
    return 'No camera/microphone detected. Connect a device and retry.'
  }
  return message
}

function GlassTelemedicineSession({
  appointmentId,
  authToken,
  userFullName,
  userRole,
  onOpenPrescription,
  onLeaveComplete,
}: GlassSessionProps) {
  const client = useRTCClient()
  const viteAppId = import.meta.env.VITE_AGORA_APP_ID?.trim()

  const { isLoading: joinLoading, error: joinError, isConnected } = useJoin(
    async () => {
      const creds = await fetchTelecomToken(appointmentId, authToken)
      if (viteAppId && viteAppId !== creds.appId) {
        console.warn(
          '[Telemedicine] VITE_AGORA_APP_ID does not match appId from telemedicine token.',
        )
      }
      return {
        appid: creds.appId,
        channel: creds.channelName,
        token: creds.token,
        uid: creds.uid,
      }
    },
    Boolean(appointmentId && authToken),
  )

  const { localMicrophoneTrack, error: micErr } = useLocalMicrophoneTrack(
    Boolean(appointmentId && authToken),
  )
  const { localCameraTrack, error: camErr } = useLocalCameraTrack(
    Boolean(appointmentId && authToken),
  )

  usePublish([localMicrophoneTrack, localCameraTrack], isConnected && !!(localMicrophoneTrack || localCameraTrack))

  const remoteUsers = useRemoteUsers()
  const remotePeer = remoteUsers[0]

  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)

  const fatalTelecomError = joinError?.message ?? null
  const mediaWarning =
    micErr?.message != null
      ? friendlyDeviceError(micErr.message)
      : camErr?.message != null
        ? friendlyDeviceError(camErr.message)
        : null

  const connecting = joinLoading || (!isConnected && !fatalTelecomError)

  const remoteLabel = userRole === 'PATIENT' ? 'Doctor' : 'Patient'

  const toggleMute = useCallback(() => {
    const t = localMicrophoneTrack
    if (!t) return
    const next = !muted
    void t.setEnabled(!next)
    setMuted(next)
  }, [localMicrophoneTrack, muted])

  const toggleVideo = useCallback(() => {
    const t = localCameraTrack
    if (!t) return
    const next = !videoOff
    void t.setEnabled(!next)
    setVideoOff(next)
  }, [localCameraTrack, videoOff])

  const handleEnd = useCallback(async () => {
    try {
      await client?.leave()
    } catch {
      /* ignore */
    }
    onLeaveComplete()
  }, [client, onLeaveComplete])

  return (
    <div
      role="region"
      aria-label="Video consultation"
      className="relative flex min-h-[min(52dvh,520px)] w-full flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950 text-white shadow-lg shadow-slate-900/15"
    >
      {/* Ambient background (shows when remote video is letterboxed or loading) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.18),transparent),radial-gradient(ellipse_80%_60%_at_100%_50%,rgba(99,102,241,0.12),transparent),radial-gradient(ellipse_60%_50%_at_0%_80%,rgba(16,185,129,0.08),transparent)]"
        aria-hidden
      />

      {/* Main stage: remote video is bound to this div (custom UI — not Agora App Builder) */}
      <div
        id="consultation-remote-player"
        className="absolute inset-0 z-[1] bg-black"
      >
        {remotePeer ? (
          <RemoteUser
            user={remotePeer}
            playVideo
            playAudio
            className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
            videoPlayerConfig={{ fit: 'cover' }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />
            <p className="text-lg font-medium text-white/90">
              Waiting for {remoteLabel.toLowerCase()}…
            </p>
            <p className="max-w-sm text-sm text-white/45">
              They will appear here when they join this secure room.
            </p>
          </div>
        )}
      </div>

      {/* Top glass header */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center p-4 sm:p-5">
        <div
          className={`pointer-events-auto flex max-w-[min(100%,42rem)] flex-1 items-center justify-between gap-4 px-4 py-2.5 sm:px-5 ${glassBar}`}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/90">
              Telemedicine
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-white/80 sm:text-sm">
              {appointmentId.slice(0, 8)}…{appointmentId.slice(-6)}
            </p>
          </div>
          <p className="hidden text-right text-xs text-white/55 sm:block">
            <span className="font-medium text-white/90">{userFullName}</span>
            <span className="text-white/40"> · </span>
            {userRole}
          </p>
        </div>
      </header>

      {/* Local PiP — bottom-right above controls */}
      <div
        id="consultation-local-player"
        className={`absolute bottom-28 right-4 z-20 h-32 w-44 sm:bottom-32 sm:right-6 sm:h-40 sm:w-52 ${glassPip}`}
      >
        {localCameraTrack || localMicrophoneTrack ? (
          <LocalUser
            audioTrack={localMicrophoneTrack}
            videoTrack={localCameraTrack}
            micOn={!muted}
            cameraOn={!videoOff}
            playAudio={false}
            playVideo
            className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-white/40">
            Camera…
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          You
        </span>
      </div>

      {(fatalTelecomError || mediaWarning) && (
        <div className="absolute left-4 right-4 top-20 z-30 sm:left-8 sm:right-8">
          <div
            className={`rounded-2xl px-4 py-3 text-sm backdrop-blur-md ${
              fatalTelecomError
                ? 'border border-rose-400/35 bg-rose-950/70 text-rose-50'
                : 'border border-amber-400/35 bg-amber-950/70 text-amber-50'
            }`}
          >
            {fatalTelecomError
              ? `Connection error: ${fatalTelecomError}`
              : mediaWarning}
          </div>
        </div>
      )}

      {connecting && !fatalTelecomError && (
        <div className="absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3 bg-slate-950/75 backdrop-blur-md">
          <Loader2 className="h-10 w-10 animate-spin text-sky-400" aria-hidden />
          <p className="text-sm font-medium text-white/90">Connecting…</p>
          <p className="max-w-xs text-center text-xs text-white/45">
            Secure token · encrypted channel
          </p>
        </div>
      )}

      {/* Floating glass controls */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-3">
        {userRole === 'DOCTOR' && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenPrescription}
            disabled={!!fatalTelecomError || connecting}
            className={`${glassBar} inline-flex items-center gap-2 text-sm font-semibold text-teal-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Pill className="h-4 w-4 shrink-0" aria-hidden />
            Prescription
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${glassBar}`}
        >
          <button
            type="button"
            onClick={() => toggleMute()}
            disabled={!!fatalTelecomError || connecting || !localMicrophoneTrack}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <MicOff className="h-5 w-5" aria-hidden />
            ) : (
              <Mic className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleVideo()}
            disabled={!!fatalTelecomError || connecting || !localCameraTrack}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
            aria-label={videoOff ? 'Turn camera on' : 'Stop video'}
          >
            {videoOff ? (
              <VideoOff className="h-5 w-5" aria-hidden />
            ) : (
              <Video className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => void handleEnd()}
            className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-900/50 transition hover:bg-rose-500"
          >
            <PhoneOff className="h-5 w-5 shrink-0" aria-hidden />
            End
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const { token: authToken, user } = useAuth()
  const navigate = useNavigate()

  const client = useMemo(
    () => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
    [],
  )

  const [rxOpen, setRxOpen] = useState(false)
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [specialAdvice, setSpecialAdvice] = useState('')
  const [labTests, setLabTests] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [medicines, setMedicines] = useState<MedicineLine[]>([
    { name: '', dosage: '', frequency: 'BD', duration: '', instructions: '' },
  ])
  const [rxSubmitting, setRxSubmitting] = useState(false)

  const prescriptionDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-LK', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(new Date()),
    [],
  )

  const goDashboard = useCallback(() => {
    if (user?.role === 'PATIENT') {
      navigate('/dashboard/patient', { replace: true })
    } else if (user?.role === 'DOCTOR') {
      navigate('/dashboard/doctor', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate, user?.role])

  async function handleIssuePrescription() {
    const apptId = appointmentId
    const bearer = authToken
    if (!apptId || !bearer) return
    const filled = medicines.filter(
      (m) => m.name.trim() && m.dosage.trim() && m.duration.trim(),
    )
    if (!diagnosis.trim() || filled.length === 0) {
      toast.error('Add diagnosis and at least one full medicine row.')
      return
    }
    setRxSubmitting(true)
    try {
      await issuePrescription(bearer, {
        appointmentId: apptId,
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim() || undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
        specialAdvice: specialAdvice.trim() || undefined,
        labTests: labTests.trim() || undefined,
        followUpDate: followUpDate || undefined,
        patientName: patientName.trim() || undefined,
        patientAge: patientAge.trim() || undefined,
        patientGender: patientGender.trim() || undefined,
        medicines: filled.map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency?.trim() || undefined,
          duration: m.duration.trim(),
          instructions: m.instructions?.trim() || undefined,
        })),
      })
      toast.success(
        'Prescription saved; appointment marked completed. Patient notified via queue.',
      )
      setRxOpen(false)
      setPatientName('')
      setPatientAge('')
      setPatientGender('')
      setSymptoms('')
      setDiagnosis('')
      setClinicalNotes('')
      setSpecialAdvice('')
      setLabTests('')
      setFollowUpDate('')
      setMedicines([
        { name: '', dosage: '', frequency: 'BD', duration: '', instructions: '' },
      ])
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string | string[] })?.message
        : undefined
      toast.error(
        typeof msg === 'string'
          ? msg
          : Array.isArray(msg)
            ? msg.join(', ')
            : 'Could not issue prescription.',
      )
    } finally {
      setRxSubmitting(false)
    }
  }

  function handlePrintPreview() {
    const printableRows = medicines
      .filter((m) => m.name.trim() || m.dosage.trim() || m.duration.trim())
      .map(
        (m, idx) =>
          `<tr><td>${idx + 1}</td><td>${m.name || '-'}</td><td>${m.dosage || '-'}</td><td>${m.frequency || '-'}</td><td>${m.duration || '-'}</td><td>${m.instructions || '-'}</td></tr>`,
      )
      .join('')
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`
      <html><head><title>Digital Prescription</title>
      <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
      h1{color:#0ea5e9;margin-bottom:4px}
      .meta{color:#475569;font-size:13px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:13px}
      th{background:#e0f2fe}
      .block{margin-top:14px}
      .label{font-weight:700;color:#0369a1}
      </style></head><body>
      <h1>MediSmart Digital Prescription</h1>
      <p class="meta">Date: ${prescriptionDateLabel} | Appointment ID: ${appointmentId ?? '-'}</p>
      <p><span class="label">Patient:</span> ${patientName || '-'} | <span class="label">Age:</span> ${patientAge || '-'} | <span class="label">Gender:</span> ${patientGender || '-'}</p>
      <div class="block"><span class="label">Symptoms:</span> ${symptoms || '-'}</div>
      <div class="block"><span class="label">Diagnosis:</span> ${diagnosis || '-'}</div>
      <table><thead><tr><th>#</th><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
      <tbody>${printableRows || '<tr><td colspan="6">No medicines added</td></tr>'}</tbody></table>
      <div class="block"><span class="label">Clinical Notes:</span> ${clinicalNotes || '-'}</div>
      <div class="block"><span class="label">Lab Tests:</span> ${labTests || '-'}</div>
      <div class="block"><span class="label">Special Advice:</span> ${specialAdvice || '-'}</div>
      <div class="block"><span class="label">Follow-up:</span> ${followUpDate || '-'}</div>
      </body></html>
    `)
    w.document.close()
    w.focus()
    w.print()
  }

  if (!appointmentId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        Invalid link.
      </div>
    )
  }

  if (!authToken || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-900 px-4 text-center text-white">
        <p className="text-sm text-white/80">Missing appointment or session.</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <>
      <AgoraRTCProvider client={client}>
        <GlassTelemedicineSession
          appointmentId={appointmentId}
          authToken={authToken}
          userFullName={user.fullName}
          userRole={user.role}
          onOpenPrescription={() => setRxOpen(true)}
          onLeaveComplete={goDashboard}
        />
      </AgoraRTCProvider>

      {user.role === 'DOCTOR' && rxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rx-title"
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-600">
                <Pill className="h-5 w-5 shrink-0" aria-hidden />
                <h2 id="rx-title" className="text-lg font-semibold text-slate-900">
                  Digital Prescription Form
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRxOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Complete consultation notes, medicines, and advice. Submission saves into
              prescriptions and marks the appointment as completed.
            </p>

            <div className="mt-5 grid gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  Date
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">{prescriptionDateLabel}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  Appointment ID
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {appointmentId}
                </p>
              </div>
              <label className="text-xs font-semibold text-slate-600">
                Patient name
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                  placeholder="Patient full name"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Age
                <input
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                  placeholder="32"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Gender
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-xs font-semibold text-slate-600">
              Symptoms
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                placeholder="Cough, fever, sore throat..."
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-slate-600">
              Diagnosis
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                placeholder="Viral upper respiratory tract infection..."
              />
            </label>

            <p className="mt-4 text-xs font-semibold text-slate-600">Medication / Rx</p>
            <div className="mt-2 space-y-3">
              {medicines.map((m, i) => (
                <div
                  key={`med-${i}`}
                  className="grid gap-2 rounded-xl border border-sky-100 bg-sky-50/40 p-3 sm:grid-cols-5"
                >
                  <input
                    value={m.name}
                    onChange={(e) => {
                      const next = [...medicines]
                      next[i] = { ...next[i]!, name: e.target.value }
                      setMedicines(next)
                    }}
                    placeholder="Drug name"
                    className="rounded-lg border border-sky-100 bg-white px-2 py-2 text-sm text-slate-800"
                  />
                  <input
                    value={m.dosage}
                    onChange={(e) => {
                      const next = [...medicines]
                      next[i] = { ...next[i]!, dosage: e.target.value }
                      setMedicines(next)
                    }}
                    placeholder="Dosage"
                    className="rounded-lg border border-sky-100 bg-white px-2 py-2 text-sm text-slate-800"
                  />
                  <select
                    value={m.frequency ?? ''}
                    onChange={(e) => {
                      const next = [...medicines]
                      next[i] = { ...next[i]!, frequency: e.target.value }
                      setMedicines(next)
                    }}
                    className="rounded-lg border border-sky-100 bg-white px-2 py-2 text-sm text-slate-800"
                  >
                    <option value="">Frequency</option>
                    <option value="OD">OD</option>
                    <option value="BD">BD</option>
                    <option value="TDS">TDS</option>
                    <option value="QDS">QDS</option>
                  </select>
                  <input
                    value={m.instructions ?? ''}
                    onChange={(e) => {
                      const next = [...medicines]
                      next[i] = { ...next[i]!, instructions: e.target.value }
                      setMedicines(next)
                    }}
                    placeholder="Instructions"
                    className="rounded-lg border border-sky-100 bg-white px-2 py-2 text-sm text-slate-800"
                  />
                  <input
                    value={m.duration}
                    onChange={(e) => {
                      const next = [...medicines]
                      next[i] = { ...next[i]!, duration: e.target.value }
                      setMedicines(next)
                    }}
                    placeholder="Duration"
                    className="rounded-lg border border-sky-100 bg-white px-2 py-2 text-sm text-slate-800"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setMedicines([
                  ...medicines,
                  {
                    name: '',
                    dosage: '',
                    frequency: 'BD',
                    duration: '',
                    instructions: '',
                  },
                ])
              }
              className="mt-3 text-sm font-semibold text-sky-700 hover:underline"
            >
              + Add medication
            </button>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                Clinical Notes
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Special Advice
                <textarea
                  value={specialAdvice}
                  onChange={(e) => setSpecialAdvice(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">
                Lab Tests
                <textarea
                  value={labTests}
                  onChange={(e) => setLabTests(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                  placeholder="Full Blood Count, X-Ray..."
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Follow-up Date
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrintPreview}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-100"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Generate PDF / Print
              </button>
              <button
                type="button"
                disabled={rxSubmitting}
                onClick={() => void handleIssuePrescription()}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
              >
                {rxSubmitting ? 'Saving…' : 'Submit prescription'}
              </button>
              <button
                type="button"
                onClick={() => setRxOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
