import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { isAxiosError } from 'axios'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchMyAppointments } from '../api/appointmentApi'
import {
  confirmPaymentIntent,
  createPaymentIntent,
  getStripePublishableKeyForClient,
} from '../api/paymentApi'
import { appCardClass, appCtaClass } from '../lib/uiTheme'

type EmbeddedPaymentState = {
  appointmentId?: string
  patientEmail?: string
  doctorName?: string
  amount?: number
}

function CardPaymentForm(props: {
  appointmentId: string
  patientEmail: string
  doctorName?: string
  amount?: number
}) {
  const { appointmentId, patientEmail, doctorName, amount } = props
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [statusLabel, setStatusLabel] = useState<string>('Processing payment')

  async function wait(ms: number) {
    await new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function waitForStatusUpdate(): Promise<string | null> {
    for (let i = 0; i < 10; i += 1) {
      const rows = await fetchMyAppointments(patientEmail)
      const row = rows.find((r) => r.id === appointmentId)
      if (row && row.status !== 'PENDING_PAYMENT') {
        return row.status
      }
      await wait(1000)
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements || submitting) return

    setSubmitting(true)
    setError(null)
    setStatusLabel('Creating secure payment intent')

    try {
      const intentRes = await createPaymentIntent({
        appointmentId,
        patientEmail,
      })
      const clientSecret = intentRes.clientSecret
      if (!clientSecret) {
        throw new Error('Payment did not return a client secret')
      }

      const card = elements.getElement(CardElement)
      if (!card) {
        throw new Error('Card input is not ready')
      }

      setStatusLabel('Confirming your card payment')
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: patientEmail },
        },
      })

      if (result.error) {
        throw new Error(result.error.message || 'Payment confirmation failed')
      }

      const pi = result.paymentIntent
      if (!pi || pi.status !== 'succeeded') {
        throw new Error('Payment was not completed')
      }

      setStatusLabel('Updating appointment status')
      await confirmPaymentIntent({
        appointmentId,
        paymentIntentId: pi.id,
        patientEmail,
      })

      const updated = await waitForStatusUpdate()
      if (updated) {
        setStatusLabel(`Appointment status: ${updated}`)
      } else {
        setStatusLabel('Payment complete. Status sync in progress')
      }

      setPaid(true)
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string | string[] })?.message
        setError(Array.isArray(msg) ? msg[0] : msg || 'Payment failed')
      } else {
        setError(err instanceof Error ? err.message : 'Payment failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (paid) {
    return (
      <div className={`${appCardClass} p-8 text-center`}>
        <div className="relative mx-auto h-20 w-20">
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
          <span className="absolute inset-1 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" aria-hidden />
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Payment successful</h1>
        <p className="mt-2 text-sm text-slate-600">{statusLabel}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard/patient/appointments"
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${appCtaClass}`}
          >
            View appointments
          </Link>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${appCardClass} p-6 sm:p-8`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Secure card payment</h1>
          <p className="mt-1 text-sm text-slate-600">
            Complete your healthcare booking without leaving the app.
          </p>
        </div>
        <div className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Appointment {appointmentId.slice(-6).toUpperCase()}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Booking summary</p>
        <p className="mt-2 text-sm text-slate-700">Doctor: {doctorName || 'Consultation'}</p>
        <p className="mt-1 text-sm text-slate-700">Email: {patientEmail}</p>
        {typeof amount === 'number' ? (
          <p className="mt-1 text-sm font-semibold text-slate-900">
            Amount: LKR {amount.toLocaleString()}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Card details
          </span>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    color: '#0f172a',
                    fontSize: '16px',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                  },
                  invalid: {
                    color: '#dc2626',
                  },
                },
              }}
            />
          </div>
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!stripe || submitting}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white ${
            submitting
              ? 'cursor-not-allowed bg-slate-400'
              : 'bg-gradient-to-r from-sky-600 to-cyan-500 shadow-lg shadow-sky-500/30 hover:from-sky-500 hover:to-cyan-400'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {statusLabel}
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Pay now
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function EmbeddedPaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as EmbeddedPaymentState

  const appointmentId = state.appointmentId || ''
  const patientEmail = state.patientEmail || ''

  const [pk, setPk] = useState<string>('')
  const [loadingPk, setLoadingPk] = useState(true)
  const [pkError, setPkError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingPk(true)
      setPkError(null)
      try {
        const key = await getStripePublishableKeyForClient()
        if (!cancelled) {
          if (!key) {
            setPkError('Stripe publishable key is not configured')
          } else {
            setPk(key)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPkError(e instanceof Error ? e.message : 'Could not load payment config')
        }
      } finally {
        if (!cancelled) setLoadingPk(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk])

  if (!appointmentId || !patientEmail) {
    return (
      <div className="page-futuristic min-h-screen px-4 py-16 text-slate-900">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-lg font-bold text-amber-900">Missing payment context</h1>
          <p className="mt-2 text-sm text-amber-800">
            Open payment from the booking flow or appointments list.
          </p>
          <button
            type="button"
            onClick={() => navigate('/find-doctor')}
            className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Find doctor
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-futuristic min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.24),transparent_45%)] px-4 py-10 text-slate-900 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        {loadingPk ? (
          <div className={`${appCardClass} flex items-center justify-center gap-2 p-8 text-slate-600`}>
            <Loader2 className="h-5 w-5 animate-spin text-sky-600" aria-hidden />
            Loading secure payment...
          </div>
        ) : pkError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <h1 className="text-lg font-bold text-rose-900">Payment unavailable</h1>
            <p className="mt-2 text-sm text-rose-700">{pkError}</p>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <CardPaymentForm
              appointmentId={appointmentId}
              patientEmail={patientEmail}
              doctorName={state.doctorName}
              amount={state.amount}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  )
}
