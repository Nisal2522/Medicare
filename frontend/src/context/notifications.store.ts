import { createContext, useContext } from 'react'

export type AppNotification = {
  id: string
  type: string
  title: string
  message: string
  ts: number
  read: boolean
}

export type NotificationContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  loading: boolean
  addNotification: (n: {
    type?: string
    title?: string
    message?: string
    ts?: number
  }) => void
  markAllRead: () => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  clearReadNotifications: () => Promise<void>
  clearNotifications: () => Promise<void>
  reloadNotifications: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}

