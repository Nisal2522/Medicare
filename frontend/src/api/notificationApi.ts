import axios from 'axios'

export const notificationApi = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_API_URL ?? 'http://localhost:3008',
  headers: { 'Content-Type': 'application/json' },
})

export type NotificationRow = {
  id: string
  type: string
  title: string
  message: string
  meta?: Record<string, unknown>
  isRead: boolean
  readAt?: string | null
  createdAt?: string | null
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchMyNotifications(
  token: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const { data } = await notificationApi.get<NotificationRow[]>('/notifications/me', {
    params: { limit },
    headers: authHeaders(token),
  })
  return data
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await notificationApi.patch(
    '/notifications/me/read-all',
    {},
    { headers: authHeaders(token) },
  )
}

export async function clearReadNotifications(token: string): Promise<void> {
  await notificationApi.delete('/notifications/me/read', {
    headers: authHeaders(token),
  })
}

export async function clearAllNotifications(token: string): Promise<void> {
  await notificationApi.delete('/notifications/me', { headers: authHeaders(token) })
}

export async function clearNotificationById(
  token: string,
  id: string,
): Promise<void> {
  await notificationApi.delete(`/notifications/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  })
}

