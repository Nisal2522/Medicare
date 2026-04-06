import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  allowedRoles: string[]
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { token, user } = useAuth()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: 'protected' }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
