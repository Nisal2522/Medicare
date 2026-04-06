import { XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LandingNavbar } from '../components/LandingNavbar'
import { appCardClass, appCtaClass } from '../lib/uiTheme'

export default function PaymentCancelPage() {
  return (
    <div className="page-futuristic min-h-screen text-slate-900">
      <LandingNavbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className={`${appCardClass} border-amber-100/80 p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <XCircle className="h-10 w-10" aria-hidden />
          </div>
          <h1 className="mt-6 text-xl font-bold text-slate-900">
            Payment cancelled
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            No charge was completed. Your appointment may still be waiting for
            payment—you can return to checkout from your appointments when you are
            ready.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/find-doctor"
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${appCtaClass}`}
            >
              Find a doctor
            </Link>
            <Link
              to="/dashboard/patient/appointments"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              My appointments
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
