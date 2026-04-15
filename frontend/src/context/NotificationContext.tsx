import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  ts: number
  read: boolean
}

type NotificationContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: {
    type?: string
    title?: string
    message?: string
    ts?: number
  }) => void
  markAllRead: () => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

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
      setNotifications((prev) => [next, ...prev].slice(0, 40))
    },
    [],
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = useMemo(
    () => notifications.reduce((n, item) => n + (item.read ? 0 : 1), 0),
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      clearNotifications,
    }),
    [notifications, unreadCount, addNotification, markAllRead, clearNotifications],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}
