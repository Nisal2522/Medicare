import { isAxiosError } from 'axios'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarCheck,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  type AvailabilitySlotDto,
  type DoctorSearchResult,
  searchDoctors,
} from '../api/doctorApi'
import { BookAppointmentModal } from '../components/BookAppointmentModal'
import { DoctorAvailabilityBadges } from '../components/DoctorAvailabilityBadges'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import {
  MEDICAL_SPECIALTIES,
  normalizeSpecialtyFromQuery,
} from '../constants/medicalSpecialties'

/** Full weekday names; backend filter + Asia/Colombo schedule */
const WEEKDAYS = [
  { short: 'Sun', full: 'Sunday' },
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
] as const

const brandGradientBar =
  'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_10px_40px_-10px_rgba(14,165,233,0.55)]'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-24'

function firstOpenSlot(availability: AvailabilitySlotDto[]) {
  return availability.find((s) => s.isAvailable)
}

function doctorInitials(name: string): string {
  const cleaned = name
    .replace(/^Dr\.?\s*/i, '')
    .replace(/^Prof\.?\s*/i, '')
    .trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1][0] ?? ''
  return `${first}${last}`.toUpperCase() || '?'
}

function DoctorAvatar({
  name,
  profilePicture,
}: {
  name: string
  profilePicture: string
}) {
  const [failed, setFailed] = useState(false)
  const url = profilePicture.trim()
  const showImg = url !== '' && !failed

  return (
    <div className="relative">
      {showImg ? (
        <img
          src={url}
          alt=""
          className="h-16 w-16 rounded-full object-cover ring-2 ring-sky-200/80"
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-200 text-base font-bold tracking-tight text-sky-900 ring-2 ring-sky-200/80"
          aria-hidden
        >
          {doctorInitials(name)}
        </div>
      )}
      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md ring-2 ring-white">
        <UserRound className="h-3.5 w-3.5" aria-hidden />
      </span>
    </div>
  )
}

function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/40 bg-white/50 p-6 shadow-inner backdrop-blur-md">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200/80" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/5 rounded bg-slate-200/90" />
          <div className="h-3 w-2/5 rounded bg-slate-200/70" />
          <div className="h-3 w-1/3 rounded bg-slate-200/60" />
        </div>
      </div>
      <div className="mt-4 h-6 w-full rounded-lg bg-slate-200/60" />
      <div className="mt-5 h-9 w-full rounded-xl bg-slate-200/70" />
    </div>
  )
}

export default function FindDoctorPage() {
  const { user, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [nameInput, setNameInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [specialty, setSpecialty] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const debouncedName = useDebouncedValue(nameInput, 500)
  const debouncedLocation = useDebouncedValue(locationInput, 500)

  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bookingDoctor, setBookingDoctor] = useState<DoctorSearchResult | null>(null)
  const [bookingSlot, setBookingSlot] = useState<AvailabilitySlotDto | null>(null)
  const bookingOpen = bookingDoctor !== null

  useEffect(() => {
    const fromUrl = normalizeSpecialtyFromQuery(searchParams.get('specialty'))
    if (fromUrl) setSpecialty(fromUrl)
  }, [searchParams])

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchDoctors({
        name: debouncedName.trim() || undefined,
        specialty: specialty ?? undefined,
        location: debouncedLocation.trim() || undefined,
        availability: onlyAvailable ? 'true' : undefined,
        day: selectedDay ?? undefined,
      })
      setDoctors(data)
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 400) {
        const msg =
          (e.response?.data as { message?: string | string[] })?.message ??
          'Invalid search parameters'
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
      } else {
        setError('Could not load doctors. Is the Doctor Service running?')
      }
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [debouncedName, debouncedLocation, specialty, selectedDay, onlyAvailable])

  useEffect(() => {
    void fetchDoctors()
  }, [fetchDoctors])

  const clearFilters = () => {
    setNameInput('')
    setLocationInput('')
    setSpecialty(null)
    setSelectedDay(null)
    setOnlyAvailable(false)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header
        className={`sticky top-0 z-40 w-full border-b border-white/25 backdrop-blur-md ${brandGradientBar}`}
      >
        <div className={`flex items-center justify-between gap-4 py-3.5 ${shell}`}>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner ring-1 ring-white/30">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <span className="block text-base font-semibold tracking-tight text-white">
                MediSmart AI
              </span>
              <span className="hidden text-xs font-medium text-sky-100 sm:block">
                Find a doctor
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {token && user?.role === 'PATIENT' ? (
              <Link
                to="/dashboard/patient"
                className="rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Dashboard
              </Link>
            ) : null}
            <Link
              to={token && user?.role === 'PATIENT' ? '/dashboard/patient/appointments' : '/my-appointments'}
              className="rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              My appointments
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className={`py-10 ${shell}`}>
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-700">
            Care network
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
            Find a doctor
          </h1>
          <p className="mt-2 text-slate-600">
            Search by name, filter by specialty, and refine by location.
          </p>
        </div>

        {/* Search header */}
        <div className="rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-white p-5 shadow-lg shadow-sky-500/10 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="doctor-search" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search by name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" aria-hidden />
                <input
                  id="doctor-search"
                  type="search"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Perera, Cardiology…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none ring-sky-400/30 transition focus:border-sky-400 focus:ring-2"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 lg:max-w-sm">
              <label htmlFor="location-filter" className="mb-1.5 block text-xs font-semibold text-slate-600">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" aria-hidden />
                <input
                  id="location-filter"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City or region"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                  autoComplete="off"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchDoctors()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-105 lg:shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              Search
            </button>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Only show doctors with open availability slots
          </label>
        </div>

        {/* Specialty chips */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Specialty
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSpecialty(null)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                specialty === null
                  ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
              }`}
            >
              All
            </button>
            {MEDICAL_SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialty((prev) => (prev === s ? null : s))}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  specialty === s
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Weekday filter (real-time: backend filters by availability.day) */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Day (Asia/Colombo)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selectedDay === null
                  ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
              }`}
            >
              Any day
            </button>
            {WEEKDAYS.map((d) => (
              <button
                key={d.full}
                type="button"
                onClick={() =>
                  setSelectedDay((prev) => (prev === d.full ? null : d.full))
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedDay === d.full
                    ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200'
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </p>
        )}

        {/* Results */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-sky-200 bg-gradient-to-b from-sky-50/50 to-white px-8 py-16 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100/80 text-sky-600 ring-4 ring-sky-200/50">
                <Stethoscope className="h-10 w-10" aria-hidden />
              </div>
              <p className="mt-6 text-lg font-semibold text-[#0f172a]">No doctors found</p>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Try a different name, clear specialty filters, or widen your location search.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl border border-sky-300 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {doctors.map((d) => {
                const quickBookSlot = firstOpenSlot(d.availability)
                return (
                  <motion.article
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex flex-col rounded-2xl border border-white/50 bg-white/65 p-6 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl ring-1 ring-sky-100/60 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <DoctorAvatar name={d.name} profilePicture={d.profilePicture} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-[#0f172a]">{d.name}</h2>
                        <p className="text-sm text-sky-700">{d.specialty}</p>
                        {d.location ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            {d.location}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100/90 px-2.5 py-1 text-xs font-semibold text-sky-900">
                        <Sparkles className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                        {d.experience} years experience
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-indigo-100/90 px-2.5 py-1 text-xs font-semibold text-indigo-900">
                        LKR {Number(d.consultationFee ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <DoctorAvailabilityBadges
                      availability={d.availability}
                      timeZone={d.timeZone}
                      onSlotSelect={(slot) => {
                        setBookingDoctor(d)
                        setBookingSlot(slot)
                      }}
                    />
                    <button
                      type="button"
                      disabled={!quickBookSlot}
                      title={
                        quickBookSlot
                          ? 'Book using the first open slot (change date in the next step if needed)'
                          : 'No open slots for this doctor right now'
                      }
                      onClick={() => {
                        if (!quickBookSlot) return
                        setBookingDoctor(d)
                        setBookingSlot(quickBookSlot)
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                    >
                      <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                      Book Now
                    </button>
                    <p className="mt-2 text-center text-[11px] text-slate-500">
                      Or choose a specific time above. Booking is sent for doctor approval.
                    </p>
                  </motion.article>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <BookAppointmentModal
        open={bookingOpen}
        onClose={() => {
          setBookingDoctor(null)
          setBookingSlot(null)
        }}
        onBooked={() => {
          setBookingDoctor(null)
          setBookingSlot(null)
        }}
        doctorId={bookingDoctor?.id ?? ''}
        doctorName={bookingDoctor?.name ?? ''}
        slots={bookingDoctor?.availability ?? []}
        initialSlot={bookingSlot}
        consultationFee={Math.max(0, Number(bookingDoctor?.consultationFee ?? 0))}
      />
    </div>
  )
}
