export const MEDICAL_SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dental',
  'Pediatrics',
  'Dermatology',
] as const

export type MedicalSpecialty = (typeof MEDICAL_SPECIALTIES)[number]

function mapLooseSpecialty(input: string): string | null {
  const lower = input.toLowerCase()
  if (lower.includes('cardio') || lower.includes('heart')) return 'Cardiology'
  if (lower.includes('dental') || lower.includes('tooth')) return 'Dental'
  if (lower.includes('pediat') || lower.includes('child')) return 'Pediatrics'
  if (lower.includes('dermat') || lower.includes('skin')) return 'Dermatology'
  if (
    lower.includes('general') ||
    lower.includes('physician') ||
    lower.includes('medicine') ||
    lower.includes('gp')
  ) {
    return 'General Medicine'
  }
  return null
}

/** Resolve URL `?specialty=` to a chip value when possible. */
export function normalizeSpecialtyFromQuery(param: string | null): string | null {
  if (!param || !param.trim()) return null
  const t = param.trim()
  const exact = MEDICAL_SPECIALTIES.find(
    (s) => s.toLowerCase() === t.toLowerCase(),
  )
  if (exact) return exact
  return mapLooseSpecialty(t)
}

/** Map AI or free-text output to a value suitable for doctor search filters. */
export function specialtyForDoctorSearch(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'General Medicine'
  const exact = MEDICAL_SPECIALTIES.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  )
  if (exact) return exact
  const loose = mapLooseSpecialty(trimmed)
  return loose ?? trimmed
}
