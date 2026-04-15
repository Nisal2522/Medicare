import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AnalyzeSymptomsDto } from './dto/analyze-symptoms.dto';
import {
  SymptomAnalysisHistory,
  type SymptomAnalysisHistoryDocument,
} from './schemas/symptom-analysis-history.schema';

/** Strip optional ```json fences and parse model output as JSON. */
function parseModelJsonObject(raw: string): Record<string, unknown> | null {
  let s = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fenced) {
    s = fenced[1].trim();
  }
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Model JSON sometimes nests `{ "result": { ... } }` or uses snake_case keys. */
function unwrapTriageObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const hasExpected = (o: Record<string, unknown>) =>
    [
      'summary',
      'preliminaryCondition',
      'possibleCondition',
      'detailedAnalysis',
      'recommendedSpecialty',
    ].some((k) => k in o);
  if (hasExpected(obj)) {
    return obj;
  }
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const inner = obj[keys[0]];
    if (
      inner &&
      typeof inner === 'object' &&
      !Array.isArray(inner) &&
      hasExpected(inner as Record<string, unknown>)
    ) {
      return inner as Record<string, unknown>;
    }
  }
  return obj;
}

function firstNonEmptyString(
  obj: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }
    const v = obj[key];
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) {
        return t;
      }
    }
  }
  return '';
}

/** Chat completions: `content` string or array parts with `text`. */
function textFromAssistantMessage(message: {
  content?: unknown;
  refusal?: unknown;
}): string | undefined {
  if (typeof message.refusal === 'string' && message.refusal.trim()) {
    return undefined;
  }
  const c = message.content;
  if (typeof c === 'string') {
    const t = c.trim();
    return t || undefined;
  }
  if (!Array.isArray(c)) {
    return undefined;
  }
  const chunks: string[] = [];
  for (const part of c) {
    if (part && typeof part === 'object' && 'text' in part) {
      const tx = (part as { text?: unknown }).text;
      if (typeof tx === 'string') {
        chunks.push(tx);
      }
    }
  }
  const joined = chunks.join('').trim();
  return joined || undefined;
}

export type SymptomAnalysisResult = {
  /** Opening narrative for the patient (2–4 sentences) */
  summary: string;
  /** Short label for the card — preliminary only, not a diagnosis */
  preliminaryCondition: string;
  /** Extra detail (optional for UI); may mirror or extend summary */
  detailedAnalysis: string;
  recommendedSpecialty: string;
  urgencyLevel: 'Low' | 'Medium' | 'High';
  disclaimer: string;
};

const JSON_DISCLAIMER =
  'This is an AI-generated suggestion and not a substitute for professional medical advice.';

const SYSTEM_PROMPT = `You are a cautious medical triage assistant for patients. Based on their described symptoms:

1) summary: 2–4 sentences in natural, plain language. Start like "Based on what you described, ..." Tie their symptoms to a general preliminary picture (not a definitive diagnosis), name which specialty to consider, and state urgency in words (e.g. "This is assessed as low urgency."). Warm and clear. No drug names or doses.
2) preliminaryCondition: ONE very short phrase for a summary card (often lowercase is fine), e.g. "chickenpox" or "possible tension-type headache — clinical review needed". Not a confirmed diagnosis label.
3) detailedAnalysis: 1–3 optional sentences with red flags to watch for or practical next steps; may overlap summary slightly.
4) recommendedSpecialty: which specialty to consider.
5) urgencyLevel: exactly Low, Medium, or High (High for chest pain with breathlessness, stroke signs, severe bleeding, etc.).

Prefer these specialty names when they fit: General Medicine, Cardiology, Dental, Pediatrics, Dermatology.

You must respond with ONLY valid JSON (no markdown). Use exactly these camelCase property names and no wrapper object:
{"summary":"...","preliminaryCondition":"...","detailedAnalysis":"...","recommendedSpecialty":"...","urgencyLevel":"Low"|"Medium"|"High"}

${JSON_DISCLAIMER}`;

const DEFAULT_GROQ_BASE = 'https://api.groq.com/openai/v1';
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
];
const GROQ_REQUEST_TIMEOUT_MS = 90_000;

@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);

  constructor(
    private readonly http: HttpService,
    @InjectModel(SymptomAnalysisHistory.name)
    private readonly historyModel: Model<SymptomAnalysisHistoryDocument>,
  ) {}

  async analyze(
    user: JwtPayload,
    payload: AnalyzeSymptomsDto,
  ): Promise<SymptomAnalysisResult> {
    if (user.role !== 'PATIENT') {
      throw new UnauthorizedException('Only patients can use symptom analysis');
    }
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (!groqKey) {
      throw new ServiceUnavailableException(
        'Symptom analysis is not configured (missing GROQ_API_KEY).',
      );
    }
    const result = await this.callGroq(payload, groqKey);
    await this.historyModel.create({
      userId: user.sub,
      userEmail: user.email.toLowerCase(),
      symptoms: payload.symptoms.trim(),
      age: payload.age,
      gender: payload.gender,
      summary: result.summary,
      preliminaryCondition: result.preliminaryCondition,
      detailedAnalysis: result.detailedAnalysis,
      recommendedSpecialty: result.recommendedSpecialty,
      urgencyLevel: result.urgencyLevel,
      disclaimer: result.disclaimer,
    });
    return result;
  }

  async listHistory(user: JwtPayload) {
    if (user.role !== 'PATIENT') {
      throw new UnauthorizedException('Only patients can view symptom history');
    }
    const rows = await this.historyModel
      .find({ userId: user.sub })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();
    return rows.map((row) => ({
      id: String(row._id),
      symptoms: row.symptoms,
      age: row.age,
      gender: row.gender,
      summary: row.summary,
      preliminaryCondition: row.preliminaryCondition,
      recommendedSpecialty: row.recommendedSpecialty,
      urgencyLevel: row.urgencyLevel,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));
  }

  /** Groq OpenAI-compatible chat completions. */
  private async callGroq(
    payload: AnalyzeSymptomsDto,
    apiKey: string,
  ): Promise<SymptomAnalysisResult> {
    const base = (process.env.GROQ_BASE_URL ?? DEFAULT_GROQ_BASE).replace(
      /\/$/,
      '',
    );
    const configuredModel = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
    const modelCandidates = [configuredModel, ...GROQ_FALLBACK_MODELS].filter(
      (model, idx, arr): model is string => !!model && arr.indexOf(model) === idx,
    );
    const url = `${base}/chat/completions`;
    const userText = `Patient profile:\n- Age: ${payload.age}\n- Gender: ${payload.gender}\n\nPatient symptom description:\n${payload.symptoms}`;

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userText },
    ];
    const axiosOpts = {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: GROQ_REQUEST_TIMEOUT_MS,
    };

    try {
      let data:
        | {
            choices?: {
              finish_reason?: string;
              message?: { content?: unknown; refusal?: unknown };
            }[];
          }
        | undefined;
      let usedModel = configuredModel;

      for (const model of modelCandidates) {
        try {
          data = await this.sendGroqChatCompletion(url, model, messages, axiosOpts);
          usedModel = model;
          break;
        } catch (err: unknown) {
          if (this.isGroqModelDecommissioned(err)) {
            this.log.warn(
              `Groq model "${model}" is unavailable; trying fallback model.`,
            );
            continue;
          }
          throw err;
        }
      }

      if (!data) {
        throw new ServiceUnavailableException(
          'Configured GROQ model is no longer supported. Please update GROQ_MODEL.',
        );
      }

      const choice = data.choices?.[0];
      const message = choice?.message;
      const raw = message ? textFromAssistantMessage(message) : undefined;
      if (!raw && choice?.finish_reason) {
        this.log.warn(
          `Groq finished with reason=${choice.finish_reason} (model=${usedModel})`,
        );
      }
      if (!raw) {
        this.log.warn('Groq returned no usable message content.');
        throw new BadGatewayException(
          'The AI service did not return an analysis. Try again or shorten your description.',
        );
      }
      const parsed = parseModelJsonObject(raw);
      if (!parsed) {
        this.log.warn(
          `Groq JSON parse failed; raw preview: ${raw.slice(0, 200)}…`,
        );
        throw new BadGatewayException(
          'The AI response could not be read. Please try again.',
        );
      }
      return this.normalize(parsed);
    } catch (err: unknown) {
      if (err instanceof BadGatewayException) {
        throw err;
      }
      if (err instanceof ServiceUnavailableException) {
        throw err;
      }
      const ax = err as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      const detail = ax.response?.data
        ? JSON.stringify(ax.response.data).slice(0, 800)
        : (ax.message ?? String(err));
      this.log.warn(
        `Groq request failed (status ${ax.response?.status ?? 'n/a'}): ${detail}`,
      );
      throw new BadGatewayException(
        'Unable to reach the AI analysis service. Try again later.',
      );
    }
  }

  private async sendGroqChatCompletion(
    url: string,
    model: string,
    messages: { role: 'system' | 'user'; content: string }[],
    axiosOpts: {
      headers: { Authorization: string; 'Content-Type': string };
      timeout: number;
    },
  ): Promise<{
    choices?: {
      finish_reason?: string;
      message?: { content?: unknown; refusal?: unknown };
    }[];
  }> {
    type GroqResponse = {
      choices?: {
        finish_reason?: string;
        message?: { content?: unknown; refusal?: unknown };
      }[];
    };

    try {
      const res = await firstValueFrom(
        this.http.post<GroqResponse>(
          url,
          {
            model,
            temperature: 0.25,
            max_tokens: 2048,
            response_format: { type: 'json_object' as const },
            messages,
          },
          axiosOpts,
        ),
      );
      return res.data;
    } catch (first: unknown) {
      const st = (first as { response?: { status?: number } }).response?.status;
      if (st === 400) {
        this.log.debug('Groq json_object rejected; retrying without it.');
        const res = await firstValueFrom(
          this.http.post<GroqResponse>(
            url,
            {
              model,
              temperature: 0.25,
              max_tokens: 2048,
              messages,
            },
            axiosOpts,
          ),
        );
        return res.data;
      }
      throw first;
    }
  }

  private isGroqModelDecommissioned(err: unknown): boolean {
    const ax = err as {
      response?: {
        status?: number;
        data?: { error?: { code?: string; message?: string } };
      };
      message?: string;
    };
    if (ax.response?.status !== 400) {
      return false;
    }
    const code = ax.response.data?.error?.code ?? '';
    const msg = ax.response.data?.error?.message ?? ax.message ?? '';
    return code === 'model_decommissioned' || /decommissioned/i.test(msg);
  }

  private normalize(parsed: Record<string, unknown>): SymptomAnalysisResult {
    const root = unwrapTriageObject(parsed);
    let preliminaryCondition = firstNonEmptyString(root, [
      'preliminaryCondition',
      'preliminary_condition',
      'PreliminaryCondition',
      'possibleCondition',
      'possible_condition',
      'PossibleCondition',
      'condition',
      'possibleFocus',
      'possible_focus',
    ]);
    if (!preliminaryCondition) {
      preliminaryCondition = 'Unspecified — seek clinician review';
    }
    preliminaryCondition = preliminaryCondition.slice(0, 200);
    let recommendedSpecialty =
      firstNonEmptyString(root, [
        'recommendedSpecialty',
        'recommended_specialty',
        'RecommendedSpecialty',
        'specialty',
        'suggestedSpecialty',
      ]) || 'General Medicine';
    recommendedSpecialty = recommendedSpecialty.slice(0, 120);
    let rawUrgency = firstNonEmptyString(root, [
      'urgencyLevel',
      'urgency_level',
      'UrgencyLevel',
      'urgency',
    ]);
    let urgencyLevel = rawUrgency || 'Low';
    const u = urgencyLevel.toLowerCase();
    if (u === 'low' || u.startsWith('low')) {
      urgencyLevel = 'Low';
    } else if (u === 'medium' || u.startsWith('medium')) {
      urgencyLevel = 'Medium';
    } else if (u === 'high' || u.startsWith('high')) {
      urgencyLevel = 'High';
    } else if (!['Low', 'Medium', 'High'].includes(urgencyLevel)) {
      urgencyLevel = 'Medium';
    }
    const uFinal = urgencyLevel as 'Low' | 'Medium' | 'High';

    let detailedAnalysis = firstNonEmptyString(root, [
      'detailedAnalysis',
      'detailed_analysis',
      'DetailedAnalysis',
      'detailedExplanation',
      'analysis',
      'explanation',
    ]).slice(0, 3500);

    let summary = firstNonEmptyString(root, [
      'summary',
      'patientSummary',
      'narrative',
      'overview',
    ]).slice(0, 2000);
    if (!summary) {
      summary = `Based on what you described, the presentation may be most consistent with ${preliminaryCondition}. You should consider consulting ${recommendedSpecialty}. This is assessed as ${uFinal.toLowerCase()} urgency.`;
    }
    if (!detailedAnalysis) {
      detailedAnalysis = summary;
    }
    return {
      summary,
      preliminaryCondition,
      detailedAnalysis,
      recommendedSpecialty,
      urgencyLevel: uFinal,
      disclaimer: JSON_DISCLAIMER,
    };
  }
}
