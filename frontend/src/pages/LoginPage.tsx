import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { AuthShell } from '../components/auth/AuthShell'
import { useAuth } from '../context/AuthContext'
import { AUTH_BG_LOGIN } from '../lib/authBackgrounds'
import { getDashboardPathByRole } from '../lib/authPaths'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setApiError(null)
    try {
      const u = await login(data.email.trim(), data.password)
      navigate(getDashboardPathByRole(u.role), { replace: true })
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 401) {
        setApiError('Invalid email or password.')
      } else {
        setApiError('Could not sign in. Is the auth service running on port 3002?')
      }
    }
  }

  function onForgotPassword(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    toast('Password reset is not wired in this demo. Use a new account or contact an admin.', {
      icon: 'ℹ️',
    })
  }

  return (
    <AuthShell title="Sign in" backgroundImageUrl={AUTH_BG_LOGIN} authPage="login">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-600">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-600">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-sky-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none ring-sky-400/25 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
          )}
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
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-semibold text-sky-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
