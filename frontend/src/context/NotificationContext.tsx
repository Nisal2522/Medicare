import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  clearAllNotifications,
  clearNotificationById,
  clearReadNotifications as clearReadNotificationsApi,
  fetchMyNotifications,
  markAllNotificationsRead,
} from '../api/notificationApi'
import {
  NotificationContext,
  type AppNotification,
} from './notifications.store'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const addNotification = useCallback(
    (n: { type?: string; title?: string; message?: string; ts?: number }) => {
      const ts = typeof n.ts === 'number' ? n.ts : Date.now()
      const next: AppNotification = {
        id: `${ts}-${Math.random().toString(16).slice(2, 10)}`,
        type: n.type?.trim() || 'general',
        title: n.title?.trim() || 'Notification',
        message: n.message?.trim() || '',
        ts,
        read: false,
      }
      setNotifications((prev) => [next, ...prev].slice(0, 50))
    },
    [],
  )

  const reloadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([])
      return
    }
    setLoading(true)
    try {
      const rows = await fetchMyNotifications(token, 50)
      setNotifications(
        rows.map((r) => ({
          id: r.id,
          type: r.type || 'general',
          title: r.title || 'Notification',
          message: r.message || '',
          ts: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          read: Boolean(r.isRead),
        })),
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void reloadNotifications()
  }, [reloadNotifications])

  const markAllRead = useCallback(async () => {
    if (token) {
      await markAllNotificationsRead(token)
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [token])

  const dismissNotification = useCallback(async (id: string) => {
    if (token) {
      await clearNotificationById(token, id)
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [token])

  const clearReadNotifications = useCallback(async () => {
    if (token) {
      await clearReadNotificationsApi(token)
    }
    setNotifications((prev) => prev.filter((n) => !n.read))
  }, [token])

  const clearNotifications = useCallback(async () => {
    if (token) {
      await clearAllNotifications(token)
    }
    setNotifications([])
  }, [token])

  const unreadCount = useMemo(
    () => notifications.reduce((n, item) => n + (item.read ? 0 : 1), 0),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAllRead,
      dismissNotification,
      clearReadNotifications,
      clearNotifications,
      reloadNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAllRead,
      dismissNotification,
      clearReadNotifications,
      clearNotifications,
      reloadNotifications,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
