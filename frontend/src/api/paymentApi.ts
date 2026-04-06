import axios from 'axios'

export const paymentApi = axios.create({
  baseURL: import.meta.env.VITE_PAYMENT_API_URL ?? 'http://localhost:3007',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type CreateCheckoutSessionPayload = {
  appointmentId: string
  patientEmail: string
  successUrl: string
  cancelUrl: string
}

export type CreateCheckoutSessionResponse = {
  checkoutUrl: string
}

export type CreatePaymentIntentPayload = {
  appointmentId: string
  patientEmail: string
}

export type CreatePaymentIntentResponse = {
  clientSecret: string | null
}

export type ConfirmPaymentIntentPayload = {
  appointmentId: string
  paymentIntentId: string
  patientEmail: string
}

export async function createCheckoutSession(
  payload: CreateCheckoutSessionPayload,
): Promise<CreateCheckoutSessionResponse> {
  const { data } = await paymentApi.post<CreateCheckoutSessionResponse>(
    '/payments/create-checkout-session',
    payload,
  )
  return data
}

export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload,
): Promise<CreatePaymentIntentResponse> {
  const { data } = await paymentApi.post<CreatePaymentIntentResponse>(
    '/payments/create-intent',
    payload,
  )
  return data
}

export async function reconcilePaymentIntentByAppointment(
  payload: CreatePaymentIntentPayload,
): Promise<{ ok: true; appointmentId: string; updated: boolean; paymentIntentId?: string }> {
  const { data } = await paymentApi.post<{
    ok: true
    appointmentId: string
    updated: boolean
    paymentIntentId?: string
  }>('/payments/reconcile-intent', payload)
  return data
}

export async function confirmPaymentIntent(payload: ConfirmPaymentIntentPayload) {
  const { data } = await paymentApi.post('/payments/confirm-intent', payload)
  return data
}

/** Safe for browser: Stripe publishable key only (pk_...). Never use secret key on the client. */
export async function fetchStripePublishableKey(): Promise<string> {
  const { data } = await paymentApi.get<{ publishableKey: string }>(
    '/payments/config',
  )
  return data.publishableKey?.trim() ?? ''
}

/** Prefer env when set; otherwise load from payment-service (same key as STRIPE_PUBLISHABLE_KEY there). */
export async function getStripePublishableKeyForClient(): Promise<string> {
  const fromEnv = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim()
  if (fromEnv) return fromEnv
  return fetchStripePublishableKey()
}
