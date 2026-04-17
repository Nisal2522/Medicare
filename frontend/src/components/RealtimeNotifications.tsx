import { useEffect } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/notifications.store'

type NotificationPayload = {
  type?: string
  title?: string
  message?: string
}

const WS_URL =
  import.meta.env.VITE_NOTIFICATION_WS_URL ?? 'http://localhost:3008'

function toastPayload(payload: NotificationPayload, fallback: string) {
  const title = payload.title?.trim()
  const message = payload.message?.trim()
  if (title && message) {
    toast.success(`${title}: ${message}`)
    return
  }
  if (title) {
    toast.success(title)
    return
  }
  if (message) {
    toast.success(message)
    return
  }
  toast.success(fallback)
}

export function RealtimeNotifications() {
  const { token, user } = useAuth()
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!token || !user) return

    const socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token },
    })

    socket.on('connect_error', () => {
      // Do not spam users with toasts while backend restarts.
    })

    socket.on('appointment_created', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'New appointment update received.')
    })
    socket.on('appointment_doctor_approved', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'Your appointment was approved.')
    })
    socket.on('video_call_reminder', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'Your video consultation is starting soon.')
    })
    socket.on('prescription_ready', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'Your prescription is ready.')
    })
    socket.on('payment_success', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'Payment completed successfully.')
    })
    socket.on('user_registered', (payload: NotificationPayload) => {
      addNotification(payload)
      toastPayload(payload, 'Welcome to MediSmart.')
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user, addNotification])

  return null
}
