import { Calendar, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { bookAppointment } from '../api/appointmentApi'
import type { AvailabilitySlotDto } from '../api/doctorApi'
import { useAuth } from '../context/AuthContext'
import {
  nextCalendarDateForWeekday,
  weekdayFromYmdColombo,
} from '../lib/colomboDate'

type Props = {
  open: boolean
  onClose: () => void
  onBooked: (payload: {
    appointmentId: string
    patientEmail: string
    doctorName: string
    amount: number
  }) => void
  doctorId: string
  doctorName: string
  slots: AvailabilitySlotDto[]
  initialSlot: AvailabilitySlotDto | null
  consultationFee: number
}

const PATIENT_NAME_KEY = 'patientName'

export function BookAppointmentModal({
  open,
  onClose,
  onBooked,
  doctorId,
  doctorName,
  slots,
  initialSlot,
  consultationFee,
}: Props) {
  const { user, token } = useAuth()
  const [patientName, setPatientName] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [selectedSlotKey, setSelectedSlotKey] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const openSlots = slots.filter((s) => s.isAvailable)
  const selectedSlot = openSlots.find(
    (s) => `${s.day}|${s.startTime}|${s.endTime}` === selectedSlotKey,
  )

  useEffect(() => {
    if (!open || openSlots.length === 0) return
    const stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(PATIENT_NAME_KEY) ?? ''
        : ''
    setPatientName(user?.fullName?.trim() || stored)
    const email =
      user?.email?.toLowerCase() ??
      window.localStorage.getItem('patientEmail') ??
      ''
    setPatientEmail(email)
    const fallback = openSlots[0] ?? null
    const boot = initialSlot && initialSlot.isAvailable ? initialSlot : fallback
    if (boot) {
      const key = `${boot.day}|${boot.startTime}|${boot.endTime}`
      setSelectedSlotKey(key)
      setAppointmentDate(nextCalendarDateForWeekday(boot.day))
    }
  }, [open, initialSlot, openSlots, user])

  if (!open || openSlots.length === 0) return null

  const dateMismatch =
    !!appointmentDate &&
    !!selectedSlot &&
    weekdayFromYmdColombo(appointmentDate) !== selectedSlot.day

  async function handleConfirm() {
    if (!selectedSlot) {
      toast.error('Please select a time slot')
      return
    }
    const name = patientName.trim()
    const email = patientEmail.trim().toLowerCase()
    if (!name || !email) {
      toast.error('Please enter your name and email')
      return
    }
    if (dateMismatch) {
      toast.error(
        'Selected date must fall on ' + selectedSlot.day + ' (Asia/Colombo)',
      )
      return
    }
    setSubmitting(true)
    try {
      const booked = await bookAppointment(
        {
          doctorId,
          patientName: name,
          patientEmail: email,
          ...(patientPhone.trim()
            ? { patientPhone: patientPhone.trim() }
            : {}),
          appointmentDate,
          day: selectedSlot.day,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          consultationFee,
        },
        {
          authToken:
            token && user?.role === 'PATIENT' ? token : undefined,
        },
      )
      window.localStorage.setItem('patientEmail', email)
      window.localStorage.setItem(PATIENT_NAME_KEY, name)
      const appointmentId = booked.appointment.id
      toast.success('Appointment requested. Waiting for doctor approval.')
      onClose()
      onBooked({
        appointmentId,
        patientEmail: email,
        doctorName,
        amount: consultationFee,
      })
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : undefined
      toast.error(
        typeof msg === 'string'
          ? msg
          : 'Could not book this slot. It may have just been taken.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl shadow-sky-900/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="book-modal-title"
              className="text-lg font-semibold text-[#0f172a]"
            >
              Confirm appointment
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Review details and confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <dl className="mt-5 space-y-3 rounded-xl bg-sky-50/80 p-4 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Doctor</dt>
            <dd className="font-medium text-slate-900">{doctorName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Day &amp; time</dt>
            <dd className="text-right font-medium text-slate-900">
              {selectedSlot?.day}{' '}
              <span className="text-slate-600">
                {selectedSlot?.startTime} – {selectedSlot?.endTime}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Consultation fee</dt>
            <dd className="font-semibold text-sky-800">
              LKR {consultationFee.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-amber-800">Pending doctor approval</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="appt-slot"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Time slot
            </label>
            <select
              id="appt-slot"
              value={selectedSlotKey}
              onChange={(e) => {
                const nextKey = e.target.value
                setSelectedSlotKey(nextKey)
                const next = openSlots.find(
                  (s) => `${s.day}|${s.startTime}|${s.endTime}` === nextKey,
                )
                if (next) {
                  setAppointmentDate(nextCalendarDateForWeekday(next.day))
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
            >
              {openSlots.map((s) => {
                const key = `${s.day}|${s.startTime}|${s.endTime}`
                return (
                  <option key={key} value={key}>
                    {s.day} - {s.startTime} to {s.endTime}
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label
              htmlFor="appt-date"
              className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600"
            >
              <Calendar className="h-3.5 w-3.5 text-sky-600" aria-hidden />
              Date (Asia/Colombo)
            </label>
            <input
              id="appt-date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-400/30 focus:border-sky-400 focus:ring-2"
            />
            {dateMismatch ? (
              <p className="mt-1 text-xs text-amber-700">
                Pick a {selectedSlot?.day} so it matches this slot.
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="patient-name"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Your name
            </label>
            <input
              id="patient-name"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
              autoComplete="name"
            />
          </div>
          <div>
            <label
              htmlFor="patient-email"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Email
            </label>
            <input
              id="patient-email"
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="patient-phone"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Mobile (optional — SMS confirmation)
            </label>
            <input
              id="patient-phone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+94771234567"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting || !!dateMismatch}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
