import api from './axios'
import { doctorApi } from './doctorApi'

export type AdminUserRow = {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt?: string
}

export type AdminStats = {
  totalPatients: number
  totalDoctors: number
  totalAppointments: number
  totalRevenue: number
  newSignUpsToday: number
  monthlyRevenue: { month: string; revenue: number }[]
}

export type AdminDoctorRow = {
  id: string
  name: string
  specialty: string
  isVerified: boolean
  location: string
  createdAt?: string
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats', {
    headers: authHeaders(token),
  })
  return data
}

export async function fetchAdminUsers(token: string): Promise<AdminUserRow[]> {
  const { data } = await api.get<AdminUserRow[]>('/admin/users', {
    headers: authHeaders(token),
  })
  return data
}

export async function deactivateAdminUser(
  token: string,
  userId: string,
): Promise<void> {
  await api.patch(
    `/admin/users/${userId}/deactivate`,
    {},
    { headers: authHeaders(token) },
  )
}

export async function activateAdminUser(
  token: string,
  userId: string,
): Promise<void> {
  await api.patch(
    `/admin/users/${userId}/activate`,
    {},
    { headers: authHeaders(token) },
  )
}

export async function deleteAdminUser(
  token: string,
  userId: string,
): Promise<void> {
  await api.delete(`/admin/users/${userId}`, {
    headers: authHeaders(token),
  })
}

export async function verifyDoctorAsAdmin(
  token: string,
  doctorId: string,
): Promise<void> {
  await api.patch(
    `/admin/verify-doctor/${doctorId}`,
    {},
    { headers: authHeaders(token) },
  )
}

export async function fetchAdminDoctors(
  token: string,
): Promise<AdminDoctorRow[]> {
  const { data } = await doctorApi.get<AdminDoctorRow[]>('/admin/doctors', {
    headers: authHeaders(token),
  })
  return data
}
