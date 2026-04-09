import axios from 'axios'

const baseURL =
  import.meta.env.VITE_AI_API_URL ?? 'http://localhost:3006'

const FALLBACK_DISCLAIMER =
  'This is an AI-generated suggestion and not a substitute for professional medical advice.'

export type SymptomAnalysisResponse = {
  summary: string
  preliminaryCondition: string
  detailedAnalysis: string
  recommendedSpecialty: string
  urgencyLevel: 'Low' | 'Medium' | 'High'
  disclaimer: string
}

function pickTrimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string') {
    return undefined
  }
  const t = v.trim()
  return t ? t : undefined
}

/**
 * Older ai-service builds returned `possibleCondition` only; some proxies strip fields.
 * Always produce a full shape so labels like "Preliminary condition" never render empty.
 */
export function normalizeSymptomAnalysis(
  raw: Record<string, unknown>,
): SymptomAnalysisResponse {
  const preliminary =
    pickTrimmedString(raw.preliminaryCondition) ??
    pickTrimmedString(raw.possibleCondition) ??
    'Unspecified — seek clinician review'

  const specialty =
    pickTrimmedString(raw.recommendedSpecialty) ?? 'General Medicine'

  const uRaw = (pickTrimmedString(raw.urgencyLevel) ?? 'Low').toLowerCase()
  let urgencyLevel: SymptomAnalysisResponse['urgencyLevel'] = 'Low'
  if (uRaw === 'high' || uRaw.startsWith('high')) {
    urgencyLevel = 'High'
  } else if (uRaw === 'medium' || uRaw.startsWith('medium')) {
    urgencyLevel = 'Medium'
  }

  let summary = pickTrimmedString(raw.summary)
  if (!summary) {
    summary = `Based on what you described, the presentation may be most consistent with ${preliminary}. You should consider consulting ${specialty}. This is assessed as ${urgencyLevel.toLowerCase()} urgency.`
  }

  const detailed =
    pickTrimmedString(raw.detailedAnalysis) ?? summary

  return {
    summary,
    preliminaryCondition: preliminary,
    detailedAnalysis: detailed,
    recommendedSpecialty: specialty,
    urgencyLevel,
    disclaimer: pickTrimmedString(raw.disclaimer) ?? FALLBACK_DISCLAIMER,
  }
}

export async function analyzeSymptoms(
  symptoms: string,
  token: string,
): Promise<SymptomAnalysisResponse> {
  const { data } = await axios.post<Record<string, unknown>>(
    `${baseURL.replace(/\/$/, '')}/ai/analyze-symptoms`,
    { symptoms },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    },
  )
  return normalizeSymptomAnalysis(
    data !== null && typeof data === 'object' ? data : {},
  )
}
