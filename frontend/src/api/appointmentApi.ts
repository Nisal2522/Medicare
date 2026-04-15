import axios from 'axios'

export const appointmentApi = axios.create({
  baseURL: import.meta.env.VITE_APPOINTMENT_API_URL ?? 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type BookAppointmentPayload = {
  doctorId: string
  patientEmail: string
  patientName: string
  appointmentDate: string
  day: string
  startTime: string
  endTime: string
  consultationFee?: number
  /** E.164 or local; used by notification-service for SMS */
  patientPhone?: string
  doctorPhone?: string
  doctorEmail?: string
}

export type BookAppointmentOptions = {
  authToken?: string | null
}

export type BookAppointmentResponse = {
  message: string
  appointment: {
    id: string
    doctorId: string
    doctorName: string
    patientEmail: string
    patientName: string
    appointmentDateKey: string
    day: string
    startTime: string
    endTime: string
    consultationFee: number
    status: string
    paymentStatus: string
    createdAt?: string
  }
}

export async function bookAppointment(
  payload: BookAppointmentPayload,
  options?: BookAppointmentOptions,
): Promise<BookAppointmentResponse> {
  const headers: Record<string, string> = {}
  if (options?.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`
  }
  const { data } = await appointmentApi.post<BookAppointmentResponse>(
    '/appointments/book',
    payload,
    { headers },
  )
  return data
}

export type MyAppointmentRow = {
  id: string
  doctorId: string
  doctorName: string
  doctorSpecialty?: string
  patientId?: string
  patientEmail: string
  patientName: string
  patientPhone?: string
  doctorPhone?: string
  doctorEmail?: string
  appointmentDateKey: string
  day: string
  startTime: string
  endTime: string
  consultationFee: number
  status: string
  paymentStatus: string
  /** PENDING | APPROVED | REJECTED — from appointment-service */
  doctorApprovalStatus: string
  createdAt?: string
}

export async function fetchMyAppointments(
  patientEmail: string,
): Promise<MyAppointmentRow[]> {
  const { data } = await appointmentApi.get<MyAppointmentRow[]>('/appointments', {
    params: { patientEmail },
  })
  return data
}

export async function doctorSetAppointmentApproval(
  appointmentId: string,
  decision: 'approve' | 'reject',
  token: string,
): Promise<{ message: string; appointment: MyAppointmentRow }> {
  const { data } = await appointmentApi.post<{
    message: string
    appointment: MyAppointmentRow
  }>(`/appointments/${appointmentId}/doctor-approval`, { decision }, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function cancelAppointment(
  appointmentId: string,
  patientEmail: string,
  token?: string,
): Promise<{ message: string }> {
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const { data } = await appointmentApi.post<{ message: string }>(
    `/appointments/${appointmentId}/cancel`,
    { patientEmail },
    { headers },
  )
  return data
}

export async function fetchPatientAppointments(
  patientId: string,
  token: string,
): Promise<MyAppointmentRow[]> {
  const { data } = await appointmentApi.get<MyAppointmentRow[]>(
    `/appointments/patient/${patientId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export async function fetchDoctorDayAppointments(
  token: string,
  date?: string,
): Promise<MyAppointmentRow[]> {
  const { data } = await appointmentApi.get<MyAppointmentRow[]>(
    '/appointments/doctor/me',
    {
      params: date ? { date } : {},
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

/** From `fromDate` (YYYY-MM-DD) onward; excludes cancelled. */
export async function fetchDoctorUpcomingAppointments(
  token: string,
  fromDate: string,
  limit = 15,
): Promise<MyAppointmentRow[]> {
  const { data } = await appointmentApi.get<MyAppointmentRow[]>(
    '/appointments/doctor/me',
    {
      params: { fromDate, limit },
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export type DoctorStatsResponse = {
  dateKey: string
  monthKey: string
  todayAppointmentCount: number
  monthCompletedCount: number
  monthEarningsTotal: number
  pendingAppointmentCount: number
  confirmedAppointmentCount: number
  completedAppointmentCount: number
  totalActiveAppointmentCount: number
}

export async function fetchDoctorStats(
  token: string,
  month?: string,
): Promise<DoctorStatsResponse> {
  const { data } = await appointmentApi.get<DoctorStatsResponse>(
    '/appointments/doctor/me/stats',
    {
      params: month ? { month } : {},
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export type MedicineLine = {
  name: string
  dosage: string
  frequency?: string
  duration: string
  instructions?: string
}

export type IssuePrescriptionBody = {
  appointmentId: string
  diagnosis: string
  symptoms?: string
  clinicalNotes?: string
  specialAdvice?: string
  labTests?: string
  followUpDate?: string
  patientName?: string
  patientAge?: string
  patientGender?: string
  medicines: MedicineLine[]
}

export type IssuePrescriptionResponse = {
  message: string
  prescription: {
    id: string
    patientId?: string
    patientEmail?: string
    doctorId: string
    appointmentId: string
    diagnosis: string
    symptoms?: string
    clinicalNotes?: string
    specialAdvice?: string
    labTests?: string
    followUpDate?: string
    patientName?: string
    patientAge?: string
    patientGender?: string
    medicines: MedicineLine[]
    medicinesSummary?: string
    createdAt?: string
  }
}

export async function issuePrescription(
  token: string,
  body: IssuePrescriptionBody,
): Promise<IssuePrescriptionResponse> {
  const { data } = await appointmentApi.post<IssuePrescriptionResponse>(
    '/prescriptions/issue',
    body,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export type DoctorPrescriptionRow = {
  id: string
  appointmentId: string
  patientName?: string
  patientEmail?: string
  diagnosis: string
  medicinesSummary: string
  followUpDate?: string
  createdAt?: string
}

export type DoctorPrescriptionDetail = {
  id: string
  patientId?: string
  appointmentId: string
  diagnosis: string
  symptoms?: string
  clinicalNotes?: string
  specialAdvice?: string
  labTests?: string
  followUpDate?: string
  patientName?: string
  patientAge?: string
  patientGender?: string
  patientEmail?: string
  medicines: MedicineLine[]
  medicinesSummary: string
  createdAt?: string
}

export async function fetchDoctorPrescriptions(
  token: string,
  options?: { q?: string; limit?: number },
): Promise<DoctorPrescriptionRow[]> {
  const { data } = await appointmentApi.get<DoctorPrescriptionRow[]>(
    '/prescriptions/doctor/me',
    {
      params: {
        ...(options?.q ? { q: options.q } : {}),
        ...(typeof options?.limit === 'number' ? { limit: options.limit } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export async function fetchDoctorPrescriptionDetail(
  token: string,
  prescriptionId: string,
): Promise<DoctorPrescriptionDetail> {
  const { data } = await appointmentApi.get<DoctorPrescriptionDetail>(
    `/prescriptions/doctor/me/${prescriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export type PatientPrescriptionRow = {
  id: string
  appointmentId: string
  doctorName?: string
  diagnosis: string
  medicinesSummary: string
  followUpDate?: string
  createdAt?: string
}

export type PatientPrescriptionDetail = {
  id: string
  appointmentId: string
  doctorName?: string
  diagnosis: string
  symptoms?: string
  clinicalNotes?: string
  specialAdvice?: string
  labTests?: string
  followUpDate?: string
  patientName?: string
  patientAge?: string
  patientGender?: string
  medicines: MedicineLine[]
  medicinesSummary: string
  createdAt?: string
}

export async function fetchPatientIssuedPrescriptions(
  token: string,
  options?: { q?: string; limit?: number },
): Promise<PatientPrescriptionRow[]> {
  const { data } = await appointmentApi.get<PatientPrescriptionRow[]>(
    '/prescriptions/patient/me',
    {
      params: {
        ...(options?.q ? { q: options.q } : {}),
        ...(typeof options?.limit === 'number' ? { limit: options.limit } : {}),
      },
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export async function fetchPatientPrescriptionDetail(
  token: string,
  prescriptionId: string,
): Promise<PatientPrescriptionDetail> {
  const { data } = await appointmentApi.get<PatientPrescriptionDetail>(
    `/prescriptions/patient/me/${prescriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}
