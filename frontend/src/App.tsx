import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import PatientLayout from './layouts/PatientLayout'
import AdminPanelPage from './pages/admin/AdminPanelPage'
import DoctorLayout from './layouts/DoctorLayout'
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage'
import DoctorAvailabilityPage from './pages/doctor/DoctorAvailabilityPage'
import DoctorDashboardHomePage from './pages/doctor/DoctorDashboardHomePage'
import DoctorPatientReportsPage from './pages/doctor/DoctorPatientReportsPage'
import DoctorPrescriptionsPage from './pages/doctor/DoctorPrescriptionsPage'
import DoctorProfilePage from './pages/doctor/DoctorProfilePage'
import FindDoctorPage from './pages/FindDoctorPage'
import LandingPage from './pages/Landing'
import LoginPage from './pages/LoginPage'
import MyAppointmentsPage from './pages/MyAppointmentsPage'
import RegisterPage from './pages/RegisterPage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import PatientDashboardPage from './pages/patient/PatientDashboardPage'
import PatientProfilePage from './pages/patient/PatientProfilePage'
import AiHealthAssistantPage from './pages/patient/AiHealthAssistantPage'
import PatientPaymentsPage from './pages/patient/PatientPaymentsPage'
import PatientPrescriptionsPage from './pages/patient/PatientPrescriptionsPage'
import PatientReportsPage from './pages/patient/PatientReportsPage'
import ConsultationAppLayout from './layouts/ConsultationAppLayout'
import VideoCallPage from './pages/VideoCallPage'
import PaymentCancelPage from './pages/PaymentCancelPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import EmbeddedPaymentPage from './pages/EmbeddedPaymentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/payment/embedded" element={<EmbeddedPaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/find-doctor" element={<FindDoctorPage />} />
        <Route path="/my-appointments" element={<MyAppointmentsPage />} />

        <Route path="/patient" element={<Navigate to="/dashboard/patient" replace />} />
        <Route path="/patient/dashboard" element={<Navigate to="/dashboard/patient" replace />} />
        <Route path="/patient/appointments" element={<Navigate to="/dashboard/patient/appointments" replace />} />
        <Route path="/patient/reports" element={<Navigate to="/dashboard/patient/reports" replace />} />
        <Route path="/patient/profile" element={<Navigate to="/dashboard/patient/profile" replace />} />
        <Route
          path="/patient/ai-assistant"
          element={<Navigate to="/dashboard/patient/symptom-checker" replace />}
        />
        <Route
          path="/dashboard/patient/ai-assistant"
          element={<Navigate to="/dashboard/patient/symptom-checker" replace />}
        />

        <Route element={<ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR']} />}>
          <Route element={<ConsultationAppLayout />}>
            <Route path="/consultation/:appointmentId" element={<VideoCallPage />} />
            <Route path="/telemedicine/:appointmentId" element={<VideoCallPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
          <Route path="/dashboard/patient" element={<PatientLayout />}>
            <Route index element={<PatientDashboardPage />} />
            <Route path="appointments" element={<PatientAppointmentsPage />} />
            <Route path="reports" element={<PatientReportsPage />} />
            <Route path="profile" element={<PatientProfilePage />} />
            <Route path="symptom-checker" element={<AiHealthAssistantPage />} />
            <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
            <Route path="payments" element={<PatientPaymentsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
          <Route path="/dashboard/doctor" element={<DoctorLayout />}>
            <Route index element={<DoctorDashboardHomePage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="patients/:patientId/reports" element={<DoctorPatientReportsPage />} />
            <Route path="availability" element={<DoctorAvailabilityPage />} />
            <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
            <Route path="profile" element={<DoctorProfilePage />} />
            <Route path="consultation/:appointmentId" element={<VideoCallPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminPanelPage />} />
          <Route path="/admin/panel" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
