import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Shield,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  fetchDoctorById,
  patchDoctorProfile,
  uploadDoctorProfilePhoto,
} from '../../api/doctorApi'
import { useAuth } from '../../context/AuthContext'

function isImageFile(f: File): boolean {
  return /^image\/(jpeg|png|gif|webp)$/i.test(f.type)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

export default function DoctorProfilePage() {
  const { user, token, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [experience, setExperience] = useState(0)
  const [location, setLocation] = useState('')
  const [qualification, setQualification] = useState('MBBS')
  const [consultationFee, setConsultationFee] = useState('1500')
  const [hospital, setHospital] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl ?? null,
  )
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const specialtyOptions = [
    'General Practice',
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
    'ENT',
    'Gynecology',
  ]

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const doc = await fetchDoctorById(user.id)
      setName(doc.name)
      setSpecialty(doc.specialty)
      setExperience(doc.experience)
      setQualification(doc.qualification?.trim() || 'MBBS')
      setConsultationFee(String(doc.consultationFee ?? 0))
      setAvatarPreview(doc.profilePicture?.trim() || user?.avatarUrl || null)
      setLocation(doc.location?.trim() || '')
      setHospital(doc.hospital?.trim() || doc.location?.trim() || '')
    } catch {
      toast.error('Could not load doctor profile from doctor-service.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setAvatarPreview(user?.avatarUrl ?? null)
  }, [user?.avatarUrl])

  async function onAvatarFile(file: File) {
    if (!token) {
      toast.error('Not signed in')
      return
    }
    if (!isImageFile(file)) {
      toast.error('Use JPEG, PNG, GIF, or WebP')
      return
    }
    setAvatarUploading(true)
    const previous = avatarPreview
    try {
      const localPreview = await fileToDataUrl(file)
      setAvatarPreview(localPreview)
      const { profilePicture, doctor } = await uploadDoctorProfilePhoto(token, file)
      const url = profilePicture || doctor.profilePicture
      setAvatarPreview(url)
      updateUser({ avatarUrl: url })
      toast.success('Profile photo saved')
    } catch (e) {
      setAvatarPreview(previous)
      toast.error(e instanceof Error ? e.message : 'Could not update photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void onAvatarFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void onAvatarFile(f)
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error('Not signed in')
      return
    }
    setProfileSaving(true)
    try {
      const updated = await patchDoctorProfile(token, {
        specialty: specialty.trim(),
        qualification: qualification.trim(),
        experience: Math.max(0, Number(experience) || 0),
        consultationFee: Math.max(0, Number(consultationFee) || 0),
        hospital: hospital.trim(),
      })
      setSpecialty(updated.specialty ?? specialty)
      setQualification(updated.qualification ?? qualification)
      setExperience(updated.experience ?? experience)
      setConsultationFee(String(updated.consultationFee ?? consultationFee))
      setHospital(updated.hospital ?? updated.location ?? hospital)
      setLocation(updated.location ?? location)
      if (updated.profilePicture?.trim()) {
        setAvatarPreview(updated.profilePicture)
        updateUser({ avatarUrl: updated.profilePicture })
      }
      toast.success('Profile saved to DB')
    } catch (e) {
      if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string | string[] })?.message
        toast.error(
          typeof msg === 'string'
            ? msg
            : Array.isArray(msg)
              ? (msg[0] ?? 'Could not save profile')
              : 'Could not save profile. Check doctor-service/auth.',
        )
      } else {
        toast.error('Could not save profile. Check doctor-service/auth.')
      }
    } finally {
      setProfileSaving(false)
    }
  }

  const sectionEyebrow =
    'mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'
  const fieldLabel = 'mb-1.5 block text-xs font-semibold text-slate-600'
  const fieldClass =
    'h-12 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none'

  return (
    <div className="w-full min-w-0 space-y-8 pb-10">
      <header className="w-full border-b border-slate-200/80 pb-8">
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
          My profile
        </h1>
      </header>

      <div className="w-full rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/70 p-6 shadow-[0_18px_44px_-26px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-12 lg:gap-y-0">
          <div className="flex max-w-md flex-col gap-7 lg:max-w-none">
            <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <p className={sectionEyebrow}>Profile photo</p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Add a clear profile image to personalize your doctor account.
              </p>
              <div className="flex justify-center sm:justify-start">
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      inputRef.current?.click()
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => !avatarUploading && inputRef.current?.click()}
                  className={`relative flex h-48 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition sm:h-52 sm:w-52 ${
                    dragOver
                      ? 'border-sky-400 bg-sky-50/90 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]'
                      : 'border-sky-200/90 bg-slate-50/40 hover:border-sky-300 hover:bg-sky-50/50'
                  } ${avatarUploading ? 'pointer-events-none opacity-80' : ''}`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={onInputChange}
                    disabled={avatarUploading}
                  />
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
                        <UserRound className="h-10 w-10" strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-sky-700">
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        Add photo
                      </span>
                      <span className="mt-1 max-w-[11rem] text-center text-xs leading-snug text-slate-500">
                        Click or drop an image here
                      </span>
                    </>
                  )}
                  {avatarPreview && !avatarUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition hover:bg-slate-900/45 hover:opacity-100">
                      <span className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
                        <Camera className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                        Change photo
                      </span>
                    </div>
                  ) : null}
                  {avatarUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm">
                      <Loader2
                        className="h-10 w-10 animate-spin text-sky-600"
                        aria-hidden
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <p className={sectionEyebrow}>Doctor profile</p>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                  Loading profile...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
                      <Stethoscope
                        className="h-7 w-7"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-slate-900">
                        {name || user?.fullName || 'Doctor'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-sky-700">
                        {specialty || 'Specialty not set'}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {experience} years experience
                      </p>
                      {location ? (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {location}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <p className={sectionEyebrow}>Identity</p>
              <div className="space-y-4">
                <div>
                  <label className={fieldLabel}>Full name</label>
                  <div className="relative">
                    <input
                      value={name || user?.fullName || ''}
                      readOnly
                      className={`${fieldClass} pr-11`}
                    />
                    <UserRound
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                      aria-hidden
                    />
                  </div>
                </div>
                <div>
                  <label className={fieldLabel}>Email</label>
                  <input
                    value={user?.email || ''}
                    readOnly
                    className={fieldClass}
                  />
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/90 px-4 py-2 text-xs font-semibold text-sky-950 shadow-sm">
                    <Shield className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                    Role: DOCTOR
                  </span>
                </div>
              </div>
            </section>
          </div>

          <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white/85 p-6 text-left shadow-sm">
            <div className="w-full max-w-xl space-y-5">
              <p className={`${sectionEyebrow} text-left`}>Edit doctor profile</p>
              <form className="space-y-4" onSubmit={(e) => void handleProfileUpdate(e)}>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className={fieldClass}
                  >
                    {specialtyOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Qualification</label>
                  <input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={fieldLabel}>Experience (years)</label>
                    <input
                      type="number"
                      min={0}
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value) || 0)}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={fieldLabel}>Consultation Fee ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Hospital</label>
                  <input
                    value={hospital}
                    onChange={(e) => {
                      setHospital(e.target.value)
                      setLocation(e.target.value)
                    }}
                    className={fieldClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:brightness-[1.03] disabled:opacity-60"
                >
                  {profileSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  )}
                  Update Profile
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
