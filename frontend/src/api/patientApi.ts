import axios from 'axios'

const patientApi = axios.create({
  baseURL: import.meta.env.VITE_PATIENT_API_URL ?? 'http://localhost:3004',
  headers: { 'Content-Type': 'application/json' },
})

export type MedicalRecordRow = {
  id: string
  patientId: string
  type: 'prescription' | 'report'
  title: string
  doctorName: string
  specialty: string
  /** prescription | blood | imaging | general (from patient uploads + API) */
  reportCategory?: string
  fileName: string
  fileUrl: string
  createdAt?: string
}

export type UploadReportMeta = {
  title?: string
  category?: 'prescription' | 'blood' | 'imaging' | 'general'
  doctorName?: string
  specialty?: string
}

export async function fetchPatientRecords(
  patientId: string,
  token: string,
): Promise<MedicalRecordRow[]> {
  const { data } = await patientApi.get<MedicalRecordRow[]>(
    `/patients/${patientId}/records`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export async function deletePatientRecord(
  patientId: string,
  recordId: string,
  token: string,
): Promise<{ message: string }> {
  const { data } = await patientApi.delete<{ message: string }>(
    `/patients/${patientId}/records/${recordId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export async function fetchPatientPrescriptions(
  patientId: string,
  token: string,
): Promise<MedicalRecordRow[]> {
  const { data } = await patientApi.get<MedicalRecordRow[]>(
    `/patients/${patientId}/prescriptions`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export type PatientPaymentRow = {
  id: string
  patientId: string
  amountCents: number
  currency: string
  description: string
  status: 'pending' | 'paid' | 'refunded' | 'failed'
  reference: string
  appointmentId: string | null
  createdAt?: string
}

export async function fetchPatientPayments(
  patientId: string,
  token: string,
): Promise<PatientPaymentRow[]> {
  const { data } = await patientApi.get<PatientPaymentRow[]>(
    `/patients/${patientId}/payments`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

const patientApiBase = () =>
  (import.meta.env.VITE_PATIENT_API_URL ?? 'http://localhost:3004').replace(
    /\/$/,
    '',
  )

/** Multipart upload — uses fetch so browser sets boundary (axios default JSON header breaks FormData). */
export async function uploadPatientReport(
  token: string,
  file: File,
  meta?: UploadReportMeta,
): Promise<MedicalRecordRow> {
  const form = new FormData()
  form.append('file', file)
  if (meta?.title?.trim()) form.append('title', meta.title.trim())
  if (meta?.category) form.append('category', meta.category)
  if (meta?.doctorName?.trim()) form.append('doctorName', meta.doctorName.trim())
  if (meta?.specialty?.trim()) form.append('specialty', meta.specialty.trim())

  const res = await fetch(`${patientApiBase()}/patients/upload-report`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') detail = body.message
      else if (Array.isArray(body.message)) detail = body.message.join(', ')
    } catch {
      try {
        detail = await res.text()
      } catch {
        /* keep statusText */
      }
    }
    throw new Error(detail || `Upload failed (${res.status})`)
  }

  return res.json() as Promise<MedicalRecordRow>
}

export type PatientProfileResponse = {
  patientId: string
  avatarUrl: string | null
}

export async function fetchPatientProfile(
  patientId: string,
  token: string,
): Promise<PatientProfileResponse> {
  const { data } = await patientApi.get<PatientProfileResponse>(
    `/patients/${patientId}/profile`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export async function uploadPatientAvatar(
  token: string,
  file: File,
): Promise<{ avatarUrl: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${patientApiBase()}/patients/upload-avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') detail = body.message
      else if (Array.isArray(body.message)) detail = body.message.join(', ')
    } catch {
      try {
        detail = await res.text()
      } catch {
        /* keep */
      }
    }
    throw new Error(detail || `Upload failed (${res.status})`)
  }
  return res.json() as Promise<{ avatarUrl: string }>
}
