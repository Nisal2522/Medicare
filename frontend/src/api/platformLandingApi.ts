function trimBase(url: string): string {
  return url.replace(/\/$/, '')
}

export type PublicLandingPayload = {
  doctorCount: number
  patientCount: number
  partners: string[]
  consultationsToday: number
  totalBookings: number
}

export async function fetchPublicLandingPayload(): Promise<PublicLandingPayload> {
  const authBase = trimBase(
    import.meta.env.VITE_API_URL ?? 'http://localhost:3002',
  )
  const aptBase = trimBase(
    import.meta.env.VITE_APPOINTMENT_API_URL ?? 'http://localhost:3003',
  )

  const [landingRes, aptRes] = await Promise.all([
    fetch(`${authBase}/auth/public/landing`),
    fetch(`${aptBase}/appointments/public/stats`),
  ])

  if (!landingRes.ok) {
    throw new Error(`auth landing ${landingRes.status}`)
  }
  if (!aptRes.ok) {
    throw new Error(`appointments stats ${aptRes.status}`)
  }

  const landing = (await landingRes.json()) as {
    doctorCount: number
    patientCount: number
    partners: string[]
  }
  const apt = (await aptRes.json()) as {
    consultationsToday: number
    totalBookings: number
  }

  return {
    doctorCount: landing.doctorCount,
    patientCount: landing.patientCount,
    partners: Array.isArray(landing.partners) ? landing.partners : [],
    consultationsToday: apt.consultationsToday,
    totalBookings: apt.totalBookings,
  }
}
