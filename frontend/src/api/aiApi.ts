import axios from 'axios'

const baseURL =
  import.meta.env.VITE_AI_API_URL ?? 'http://localhost:3006'

export type SymptomAnalysisResponse = {
  possibleCondition: string
  recommendedSpecialty: string
  urgencyLevel: 'Low' | 'Medium' | 'High'
  disclaimer: string
}

export async function analyzeSymptoms(
  symptoms: string,
  token: string,
): Promise<SymptomAnalysisResponse> {
  const { data } = await axios.post<SymptomAnalysisResponse>(
    `${baseURL.replace(/\/$/, '')}/ai/analyze-symptoms`,
    { symptoms },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return data
}
