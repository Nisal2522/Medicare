import { Outlet } from 'react-router-dom'
import { PatientDashboardFrame } from './PatientDashboardFrame'

const shell =
  'mx-auto w-full max-w-[min(100%,92rem)] px-4 sm:px-6 lg:px-8'

export default function PatientLayout() {
  return (
    <PatientDashboardFrame mainInnerClassName={`py-6 sm:py-8 ${shell}`}>
      <Outlet />
    </PatientDashboardFrame>
  )
}
