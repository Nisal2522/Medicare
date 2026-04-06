import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { JwtPayload } from '../auth/jwt.strategy';

export type SymptomAnalysisResult = {
  possibleCondition: string;
  recommendedSpecialty: string;
  urgencyLevel: 'Low' | 'Medium' | 'High';
  disclaimer: string;
};

const JSON_DISCLAIMER =
  'This is an AI-generated suggestion and not a substitute for professional medical advice.';

const SYSTEM_PROMPT = `You are a cautious medical triage assistant. Based on the user's described symptoms, suggest:
1) the most likely general condition (plain language, not a definitive label),
2) which medical specialty they should consider consulting,
3) an urgency level: Low, Medium, or High (High if red flags like chest pain with shortness of breath, stroke signs, severe bleeding, or similar).

Prefer these specialty names when they fit: General Medicine, Cardiology, Dental, Pediatrics, Dermatology.

You must respond with ONLY valid JSON (no markdown) in this exact shape:
{"possibleCondition":"...","recommendedSpecialty":"...","urgencyLevel":"Low"|"Medium"|"High"}

${JSON_DISCLAIMER}`;

@Injectable()
export class AiService {
  constructor(private readonly http: HttpService) {}

  analyze(user: JwtPayload, symptoms: string): Promise<SymptomAnalysisResult> {
    if (user.role !== 'PATIENT') {
      throw new UnauthorizedException('Only patients can use symptom analysis');
    }
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return Promise.resolve(this.heuristicFallback(symptoms));
    }
    return this.callOpenAi(symptoms);
  }

  private async callOpenAi(symptoms: string): Promise<SymptomAnalysisResult> {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const url =
      process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
    try {
      const { data } = await firstValueFrom(
        this.http.post<{
          choices?: { message?: { content?: string } }[];
        }>(
          url,
          {
            model,
            temperature: 0.25,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Patient symptom description:\n${symptoms}`,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 45_000,
          },
        ),
      );
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        return this.heuristicFallback(symptoms);
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return this.normalize(parsed);
      } catch {
        return this.heuristicFallback(symptoms);
      }
    } catch {
      return this.heuristicFallback(symptoms);
    }
  }

  private normalize(parsed: Record<string, unknown>): SymptomAnalysisResult {
    const possibleCondition = String(
      parsed.possibleCondition ?? 'Unspecified — seek clinician review',
    ).slice(0, 500);
    const recommendedSpecialty = String(
      parsed.recommendedSpecialty ?? 'General Medicine',
    ).slice(0, 120);
    let urgencyLevel = String(parsed.urgencyLevel ?? 'Low');
    if (!['Low', 'Medium', 'High'].includes(urgencyLevel)) {
      urgencyLevel = 'Medium';
    }
    return {
      possibleCondition,
      recommendedSpecialty,
      urgencyLevel: urgencyLevel as 'Low' | 'Medium' | 'High',
      disclaimer: JSON_DISCLAIMER,
    };
  }

  /** Offline / demo when no API key or provider failure (caller may catch). */
  heuristicFallback(symptoms: string): SymptomAnalysisResult {
    const s = symptoms.toLowerCase();
    let specialty = 'General Medicine';
    let condition = 'Non-specific symptoms — clinical evaluation recommended';
    let urgency: 'Low' | 'Medium' | 'High' = 'Low';

    if (
      /chest|heart|palpitation|pressure\s*on\s*chest|short\s*of\s*breath|sob\b/.test(
        s,
      )
    ) {
      specialty = 'Cardiology';
      condition =
        'Possible cardiovascular-related symptoms — needs timely medical assessment';
      urgency = /crushing|severe|radiat|faint|sweat/.test(s) ? 'High' : 'Medium';
    } else if (/tooth|teeth|gum|dental|jaw\s*pain/.test(s)) {
      specialty = 'Dental';
      condition = 'Possible dental or oral issue';
    } else if (/skin|rash|itch|mole|dermat/.test(s)) {
      specialty = 'Dermatology';
      condition = 'Possible skin-related condition';
    } else if (/child|infant|toddler|baby/.test(s)) {
      specialty = 'Pediatrics';
      condition = 'Pediatric presentation — clinician guidance advised';
      urgency = 'Medium';
    } else if (/fever|severe|sudden|worst|blood|unconscious/.test(s)) {
      urgency = 'High';
      condition = 'Symptoms may warrant urgent in-person care';
    }

    return {
      possibleCondition: condition,
      recommendedSpecialty: specialty,
      urgencyLevel: urgency,
      disclaimer: JSON_DISCLAIMER,
    };
  }
}
