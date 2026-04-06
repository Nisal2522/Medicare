import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../context/AuthContext'
import { AUTH_BG_REGISTER } from '../lib/authBackgrounds'
import { getDashboardPathByRole } from '../lib/authPaths'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Use at least 8 characters'),
  role: z.enum(['PATIENT', 'DOCTOR'], { message: 'Choose account type' }),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'PATIENT' },
  })

  const role = watch('role')

  async function onSubmit(data: RegisterForm) {
    setApiError(null)
    try {
      const user = await registerUser({
        ...data,
        phone: data.phone?.trim() || undefined,
      })
      toast.success('Welcome! Your account is ready.')
      navigate(getDashboardPathByRole(user.role), { replace: true })
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        setApiError('An account with this email already exists.')
      } else if (isAxiosError(e)) {
        setApiError('Registration failed. Is the auth service running?')
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthShell
      title="Create your account"
      backgroundImageUrl={AUTH_BG_REGISTER}
      authPage="register"
      compactCard
    >
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-xs font-semibold text-slate-600">
            Full name
          </label>
          <input
            id="reg-name"
            autoComplete="name"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner shadow-sky-500/5 outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="Dr. Saman Perera"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-xs font-semibold text-slate-600">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="reg-phone" className="mb-1.5 block text-xs font-semibold text-slate-600">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="+94 77 123 4567"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-xs font-semibold text-slate-600">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">I am a</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'PATIENT', { shouldValidate: true })}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                role === 'PATIENT'
                  ? 'border-sky-500 bg-sky-500/15 text-sky-900 shadow-md shadow-sky-500/20'
                  : 'border-white/80 bg-white/50 text-slate-600 hover:border-sky-200'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'DOCTOR', { shouldValidate: true })}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                role === 'DOCTOR'
                  ? 'border-sky-500 bg-sky-500/15 text-sky-900 shadow-md shadow-sky-500/20'
                  : 'border-white/80 bg-white/50 text-slate-600 hover:border-sky-200'
              }`}
            >
              Doctor
            </button>
          </div>
          <input type="hidden" {...register('role')} />
          {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>}
        </div>

        {apiError && (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm text-amber-900 backdrop-blur-sm">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:brightness-105 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Register
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-sky-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
