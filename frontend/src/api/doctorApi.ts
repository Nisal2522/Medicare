import axios from 'axios'

/** Doctor Service - default matches assignment: http://localhost:3000/doctors/search */
export const doctorApi = axios.create({
  baseURL: import.meta.env.VITE_DOCTOR_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

const doctorApiBase = () =>
  (import.meta.env.VITE_DOCTOR_API_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )

export type AvailabilitySlotDto = {
  day: string
  startTime: string
  endTime: string
  maxPatients: number
  isAvailable: boolean
  timeZone: 'Asia/Colombo'
}

export type DoctorSearchResult = {
  id: string
  name: string
  specialty: string
  experience: number
  qualification?: string
  consultationFee?: number
  profilePicture: string
  availability: AvailabilitySlotDto[]
  timeZone: 'Asia/Colombo'
  hospital?: string
  location?: string
}

export type DayAvailabilityPayload = {
  day: string
  closed: boolean
  slots: { startTime: string; endTime: string; maxPatients?: number }[]
}

export async function patchDoctorAvailability(
  token: string,
  days: DayAvailabilityPayload[],
): Promise<DoctorSearchResult> {
  const { data } = await doctorApi.patch<DoctorSearchResult>(
    '/doctors/availability',
    { days },
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export async function fetchDoctorById(id: string): Promise<DoctorSearchResult> {
  const { data } = await doctorApi.get<DoctorSearchResult>(`/doctors/${id}`)
  return data
}

export async function fetchDoctorMe(token: string): Promise<DoctorSearchResult> {
  const { data } = await doctorApi.get<DoctorSearchResult>('/doctors/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function patchDoctorProfile(
  token: string,
  payload: {
    specialty?: string
    qualification?: string
    experience?: number
    consultationFee?: number
    hospital?: string
    profilePicture?: string
  },
): Promise<DoctorSearchResult> {
  const { data } = await doctorApi.patch<DoctorSearchResult>(
    '/doctors/profile',
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  return data
}

export async function uploadDoctorProfilePhoto(
  token: string,
  file: File,
): Promise<{ profilePicture: string; doctor: DoctorSearchResult }> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${doctorApiBase()}/doctors/profile/photo`, {
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

  return res.json() as Promise<{ profilePicture: string; doctor: DoctorSearchResult }>
}

export async function searchDoctors(params: {
  name?: string
  specialty?: string
  availability?: 'true' | 'false'
  location?: string
  /** e.g. Monday, Mon; backend normalizes */
  day?: string
}): Promise<DoctorSearchResult[]> {
  const { data } = await doctorApi.get<DoctorSearchResult[]>('/doctors/search', {
    params,
  })
  return data
}
