import api from './axios'

export type AuthMeUser = {
  id: string
  fullName: string
  email: string
  role: string
  phone: string
}

export async function fetchAuthMe(token: string): Promise<AuthMeUser> {
  const { data } = await api.get<AuthMeUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return {
    ...data,
    id: String(data.id),
    phone: data.phone ?? '',
  }
}

export type PatchAuthProfilePayload = {
  fullName?: string
  email?: string
  phone?: string
  currentPassword?: string
  newPassword?: string
}

export async function patchAuthProfile(
  token: string,
  payload: PatchAuthProfilePayload,
): Promise<{ accessToken: string; user: AuthMeUser }> {
  const { data } = await api.patch<{
    accessToken: string
    user: AuthMeUser
  }>('/auth/me', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return {
    accessToken: data.accessToken,
    user: {
      ...data.user,
      id: String(data.user.id),
      phone: data.user.phone ?? '',
    },
  }
}
