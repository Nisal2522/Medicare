import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LandingNavbar } from '../components/LandingNavbar'
import { appCardClass, appCtaClass } from '../lib/uiTheme'

export default function PaymentSuccessPage() {
  return (
    <div className="page-futuristic min-h-screen text-slate-900">
      <LandingNavbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className={`${appCardClass} p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" aria-hidden />
          </div>
          <h1 className="mt-6 text-xl font-bold text-slate-900">
            Payment received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Stripe has confirmed your checkout. Our servers finalize the booking
            using a secure webhook, so your appointment may show as confirmed
            within a few seconds.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/dashboard/patient/appointments"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${appCtaClass}`}
            >
              My appointments
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
