import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import api from '../api/axios'

const TOKEN_KEY = 'healthcare_auth_token'
const USER_KEY = 'healthcare_auth_user'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: string
  phone?: string
  /** Set after profile photo upload or GET /patients/:id/profile */
  avatarUrl?: string
}

type RegisterPayload = {
  fullName: string
  email: string
  password: string
  role: 'PATIENT' | 'DOCTOR'
  phone?: string
}

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => void
  setSession: (token: string, user: AuthUser) => void
  /** Merge into stored user (e.g. avatarUrl from patient-service). */
  updateUser: (
    partial: Partial<
      Pick<AuthUser, 'fullName' | 'email' | 'phone' | 'avatarUrl'>
    >,
  ) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const setSession = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    localStorage.setItem('patientEmail', u.email.toLowerCase())
    setToken(t)
    setUser(u)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{
        accessToken: string
        user: {
          id: string
          fullName: string
          email: string
          role: string
          phone?: string
        }
      }>('/auth/login', { email, password })
      const u: AuthUser = {
        id: String(data.user.id),
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone ?? '',
      }
      setSession(data.accessToken, u)
      return u
    },
    [setSession],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await api.post('/auth/register', {
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        role: payload.role,
        ...(payload.phone != null && payload.phone.trim() !== ''
          ? { phone: payload.phone.trim() }
          : {}),
      })
      return login(payload.email.trim(), payload.password)
    },
    [login],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('patientEmail')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback(
    (
      partial: Partial<
        Pick<AuthUser, 'fullName' | 'email' | 'phone' | 'avatarUrl'>
      >,
    ) => {
      setUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...partial }
        localStorage.setItem(USER_KEY, JSON.stringify(next))
        if (partial.email != null) {
          localStorage.setItem('patientEmail', partial.email.toLowerCase())
        }
        return next
      })
    },
    [],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      logout,
      setSession,
      updateUser,
    }),
    [token, user, login, register, logout, setSession, updateUser],
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        if (cancelled) return
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('patientEmail')
        setToken(null)
        setUser(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
