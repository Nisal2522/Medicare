import axios from 'axios'

const telecomApi = axios.create({
  baseURL: import.meta.env.VITE_TELEMEDICINE_API_URL ?? 'http://localhost:3005',
  headers: { 'Content-Type': 'application/json' },
})

export type TelecomTokenResponse = {
  token: string
  appId: string
  channelName: string
  uid: number
  expiresIn: number
  expiresAt: number
}

export async function fetchTelecomToken(
  appointmentId: string,
  authToken: string,
): Promise<TelecomTokenResponse> {
  const { data } = await telecomApi.get<TelecomTokenResponse>(
    `/telecom/token/${encodeURIComponent(appointmentId)}`,
    { headers: { Authorization: `Bearer ${authToken}` } },
  )
  return data
}
