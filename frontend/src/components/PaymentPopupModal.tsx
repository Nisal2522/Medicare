import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { isAxiosError } from 'axios'
import { CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { fetchMyAppointments } from '../api/appointmentApi'
import {
  confirmPaymentIntent,
  createPaymentIntent,
  getStripePublishableKeyForClient,
} from '../api/paymentApi'

export type PaymentContext = {
  appointmentId: string
  patientEmail: string
  doctorName: string
  amount: number
}

type PopupProps = {
  open: boolean
  payment: PaymentContext | null
  onClose: () => void
}

function StripeCardForm({ payment, onClose }: { payment: PaymentContext; onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const [statusText, setStatusText] = useState('Processing payment')

  async function wait(ms: number) {
    await new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  async function refreshStatus(): Promise<string | null> {
    for (let i = 0; i < 8; i += 1) {
      const rows = await fetchMyAppointments(payment.patientEmail)
      const row = rows.find((r) => r.id === payment.appointmentId)
      if (row && row.status !== 'PENDING_PAYMENT') return row.status
      await wait(900)
    }
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      setStatusText('Creating secure payment intent')
      const { clientSecret } = await createPaymentIntent({
        appointmentId: payment.appointmentId,
        patientEmail: payment.patientEmail,
      })
      if (!clientSecret) throw new Error('Payment intent creation failed')

      const card = elements.getElement(CardElement)
      if (!card) throw new Error('Card input not ready')

      setStatusText('Confirming card payment')
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email: payment.patientEmail },
        },
      })

      if (result.error) {
        throw new Error(result.error.message || 'Payment confirmation failed')
      }
      const intent = result.paymentIntent
      if (!intent || intent.status !== 'succeeded') {
        throw new Error('Payment not completed')
      }

      setStatusText('Finalizing appointment status')
      await confirmPaymentIntent({
        appointmentId: payment.appointmentId,
        paymentIntentId: intent.id,
        patientEmail: payment.patientEmail,
      })

      const status = await refreshStatus()
      if (status) setStatusText(`Appointment status: ${status}`)
      setPaid(true)
      toast.success('Payment completed successfully')
    } catch (err) {
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

  return (
    <div className="relative w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Close payment"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      {paid ? (
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
            <span className="absolute inset-1 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" aria-hidden />
            </span>
          </div>
          <h3 className="mt-5 text-2xl font-bold text-slate-900">Payment successful</h3>
          <p className="mt-2 text-sm text-slate-600">{statusText}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-slate-900">Complete payment</h2>
          <p className="mt-1 text-sm text-slate-600">
            Appointment {payment.appointmentId.slice(-6).toUpperCase()} - {payment.doctorName}
          </p>
          <p className="mt-1 text-sm font-semibold text-sky-800">
            LKR {payment.amount.toLocaleString()}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Card details</p>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-200">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        color: '#0f172a',
                        fontSize: '16px',
                        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                        '::placeholder': { color: '#94a3b8' },
                      },
                      invalid: { color: '#dc2626' },
                    },
                  }}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!stripe || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {statusText}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Pay now
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export function PaymentPopupModal({ open, payment, onClose }: PopupProps) {
  const [pk, setPk] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const key = await getStripePublishableKeyForClient()
        if (!cancelled) {
          if (!key) {
            setError('Stripe publishable key is missing')
          } else {
            setPk(key)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load payment config')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const stripePromise = useMemo(() => (pk ? loadStripe(pk) : null), [pk])

  if (!open || !payment) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close payment popup"
      />
      {loading ? (
        <div className="relative w-full max-w-lg rounded-3xl border border-white/70 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" aria-hidden />
          <p className="mt-3 text-sm font-medium text-slate-700">Loading secure payment...</p>
        </div>
      ) : error ? (
        <div className="relative w-full max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-2xl">
          <p className="text-sm font-medium text-rose-800">{error}</p>
        </div>
      ) : stripePromise ? (
        <Elements stripe={stripePromise}>
          <StripeCardForm payment={payment} onClose={onClose} />
        </Elements>
      ) : null}
    </div>
  )
}
