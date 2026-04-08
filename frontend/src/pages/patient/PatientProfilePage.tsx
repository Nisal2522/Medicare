import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  Camera,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  Shield,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import {
  fetchAuthMe,
  patchAuthProfile,
} from '../../api/authProfileApi'
import {
  fetchPatientProfile,
  updatePatientProfile,
  uploadPatientAvatar,
} from '../../api/patientApi'
import { useAuth } from '../../context/AuthContext'

function isImageFile(f: File): boolean {
  return /^image\/(jpeg|png|gif|webp)$/i.test(f.type)
}

const profileSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().optional(),
    age: z.string().default(''),
    gender: z.union([
      z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
      z.literal(''),
    ]).default(''),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.age && data.age.trim()) {
      const n = Number(data.age)
      if (!Number.isFinite(n) || n < 0 || n > 130) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Age must be between 0 and 130',
          path: ['age'],
        })
      }
    }
    const hasNew = !!(data.newPassword && data.newPassword.length > 0)
    if (hasNew) {
      if (data.newPassword!.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Use at least 8 characters',
          path: ['newPassword'],
        })
      }
      if (!data.currentPassword?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter your current password',
          path: ['currentPassword'],
        })
      }
    }
  })

type ProfileFormInput = z.input<typeof profileSchema>
type ProfileForm = z.output<typeof profileSchema>

export default function PatientProfilePage() {
  const { user, token, updateUser, setSession } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl ?? null,
  )
  const [profileLoading, setProfileLoading] = useState(true)
  const [authMeLoading, setAuthMeLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput, unknown, ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      age: '',
      gender: '',
      currentPassword: '',
      newPassword: '',
    },
  })

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? null)
  }, [user?.avatarUrl])

  useEffect(() => {
    if (!token) {
      setAuthMeLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchAuthMe(token)
        if (cancelled) return
        updateUser({
          fullName: me.fullName,
          email: me.email,
          phone: me.phone,
        })
        reset({
          fullName: me.fullName,
          email: me.email,
          phone: me.phone,
          age: '',
          gender: '',
          currentPassword: '',
          newPassword: '',
        })
      } catch {
        if (!cancelled) {
          /* auth offline — keep cached user */
        }
      } finally {
        if (!cancelled) setAuthMeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, updateUser, reset])

  useEffect(() => {
    if (!user?.id || !token) {
      setProfileLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchPatientProfile(user.id, token)
        if (!cancelled) {
          if (p.avatarUrl) {
            setAvatarUrl(p.avatarUrl)
            updateUser({ avatarUrl: p.avatarUrl })
          }
          reset({
            ...getValues(),
            age: typeof p.age === 'number' ? String(p.age) : '',
            gender:
              p.gender === 'male' ||
              p.gender === 'female' ||
              p.gender === 'other' ||
              p.gender === 'prefer-not-to-say'
                ? p.gender
                : '',
          })
        }
      } catch {
        if (!cancelled) {
          /* keep local / empty; patient-service may be offline */
        }
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, token, updateUser, reset, getValues])

  const runUpload = useCallback(
    async (file: File) => {
      if (!token) {
        toast.error('Not signed in')
        return
      }
      if (!isImageFile(file)) {
        toast.error('Use JPEG, PNG, GIF, or WebP')
        return
      }
      setUploading(true)
      try {
        const { avatarUrl: url } = await uploadPatientAvatar(token, file)
        setAvatarUrl(url)
        updateUser({ avatarUrl: url })
        toast.success('Profile photo updated')
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : 'Could not upload photo',
        )
      } finally {
        setUploading(false)
      }
    },
    [token, updateUser],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void runUpload(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void runUpload(f)
  }

  async function onSaveProfile(data: ProfileForm) {
    if (!token || !user) {
      toast.error('Not signed in')
      return
    }
    const payload: Parameters<typeof patchAuthProfile>[1] = {
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: (data.phone ?? '').trim(),
    }
    if (data.newPassword && data.newPassword.length > 0) {
      payload.currentPassword = data.currentPassword
      payload.newPassword = data.newPassword
    }
    try {
      const { accessToken, user: u } = await patchAuthProfile(token, payload)
      const normalizedAge = data.age?.trim() ? Number(data.age.trim()) : undefined
      const normalizedGender = data.gender || undefined
      if (user.id) {
        await updatePatientProfile(user.id, accessToken, {
          ...(typeof normalizedAge === 'number' && Number.isFinite(normalizedAge)
            ? { age: normalizedAge }
            : {}),
          ...(normalizedGender ? { gender: normalizedGender } : {}),
        })
      }
      setSession(accessToken, {
        id: String(u.id),
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        phone: u.phone,
        avatarUrl: user.avatarUrl,
      })
      reset({
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        age: data.age ?? '',
        gender: data.gender ?? '',
        currentPassword: '',
        newPassword: '',
      })
      toast.success('Profile updated')
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        toast.error('That email is already in use.')
      } else if (isAxiosError(e) && e.response?.status === 401) {
        toast.error('Current password is incorrect.')
      } else if (isAxiosError(e) && e.response?.status === 400) {
        const msg =
          (e.response?.data as { message?: string | string[] })?.message
        toast.error(
          Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not save profile',
        )
      } else {
        toast.error('Could not save profile. Is the auth service running?')
      }
    }
  }

  const roleLabel = user?.role ?? 'PATIENT'
  const formBusy = authMeLoading || isSubmitting

  const fieldClass =
    'h-12 w-full rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70'

  const sectionEyebrow =
    'mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400'

  const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600'

  return (
    <div className="w-full min-w-0 space-y-8 pb-10">
      <header className="w-full border-b border-slate-200/80 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Profile
        </h1>
      </header>

      <div className="w-full rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/70 p-6 shadow-[0_18px_44px_-26px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
        <form
          onSubmit={(e) => void handleSubmit(onSaveProfile)(e)}
          className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-12 lg:gap-y-0"
        >
          {/* Left column: photo → password → save */}
          <div className="flex max-w-md flex-col gap-7 lg:max-w-none">
            <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm">
              <p className={sectionEyebrow}>
                Profile photo
              </p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Add a clear profile image to personalize your patient account.
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
                  onClick={() => !uploading && inputRef.current?.click()}
                  className={`relative flex h-48 w-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition sm:h-52 sm:w-52 ${
                    dragOver
                      ? 'border-sky-400 bg-sky-50/90 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]'
                      : 'border-sky-200/90 bg-slate-50/40 hover:border-sky-300 hover:bg-sky-50/50'
                  } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={onInputChange}
                    disabled={uploading}
                  />
                  {profileLoading && !avatarUrl ? (
                    <Loader2
                      className="h-10 w-10 animate-spin text-sky-500"
                      aria-hidden
                    />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
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
                  {avatarUrl && !uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition hover:bg-slate-900/45 hover:opacity-100">
                      <span className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
                        <Camera className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                        Change photo
                      </span>
                    </div>
                  ) : null}
                  {uploading ? (
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
              <p className={sectionEyebrow}>Change password</p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Leave blank to keep your current password.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="profile-current-password" className={labelClass}>
                    Current password
                  </label>
                  <input
                    id="profile-current-password"
                    type="password"
                    autoComplete="current-password"
                    disabled={formBusy}
                    className={fieldClass}
                    {...register('currentPassword')}
                  />
                  {errors.currentPassword && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="profile-new-password" className={labelClass}>
                    New password
                  </label>
                  <input
                    id="profile-new-password"
                    type="password"
                    autoComplete="new-password"
                    disabled={formBusy}
                    className={fieldClass}
                    {...register('newPassword')}
                  />
                  {errors.newPassword && (
                    <p className="mt-1.5 text-xs text-rose-600">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="pt-1">
              <button
                type="submit"
                disabled={formBusy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:brightness-[1.03] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Save changes
              </button>
            </div>
          </div>

          {/* Right column: account details — left-aligned labels and fields */}
          <section className="flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white/85 p-6 text-left shadow-sm">
            <div className="w-full max-w-xl space-y-5">
              <p className={`${sectionEyebrow} text-left`}>Account details</p>
              <p className="text-left text-sm text-slate-500">
                These details are synced with your sign-in account.
              </p>
              {authMeLoading ? (
                <p className="text-left text-xs text-slate-400">
                  Syncing with your account…
                </p>
              ) : null}

              <div className="space-y-1.5 text-left">
                <label htmlFor="profile-fullName" className={`${labelClass} text-left`}>
                  Full name
                </label>
                <input
                  id="profile-fullName"
                  autoComplete="name"
                  disabled={formBusy}
                  className={fieldClass}
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="mt-1 text-left text-xs text-rose-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="profile-email" className={`${labelClass} text-left`}>
                  Email
                </label>
                <div className="relative">
                  <input
                    id="profile-email"
                    type="email"
                    autoComplete="email"
                    disabled={formBusy}
                    className={`${fieldClass} pr-11`}
                    {...register('email')}
                  />
                  <Mail
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                    aria-hidden
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-left text-xs text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="profile-phone" className={`${labelClass} text-left`}>
                  Phone
                </label>
                <div className="relative">
                  <input
                    id="profile-phone"
                    type="tel"
                    autoComplete="tel"
                    disabled={formBusy}
                    placeholder="Optional"
                    className={`${fieldClass} pr-11`}
                    {...register('phone')}
                  />
                  <Phone
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-600"
                    aria-hidden
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-left text-xs text-rose-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="profile-age" className={`${labelClass} text-left`}>
                    Age
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    min={0}
                    max={130}
                    disabled={formBusy}
                    placeholder="Optional"
                    className={fieldClass}
                    {...register('age')}
                  />
                  {errors.age && (
                    <p className="mt-1 text-left text-xs text-rose-600">
                      {errors.age.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 text-left">
                  <label htmlFor="profile-gender" className={`${labelClass} text-left`}>
                    Gender
                  </label>
                  <select
                    id="profile-gender"
                    disabled={formBusy}
                    className={fieldClass}
                    {...register('gender')}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-left text-xs text-rose-600">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-start pt-1 text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/90 px-4 py-2 text-xs font-semibold text-sky-950 shadow-sm">
                  <Shield className="h-3.5 w-3.5 text-sky-600" aria-hidden />
                  Role: {roleLabel}
                </span>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  )
}
