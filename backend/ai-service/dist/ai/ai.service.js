"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
function parseModelJsonObject(raw) {
    let s = raw.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
    if (fenced) {
        s = fenced[1].trim();
    }
    try {
        return JSON.parse(s);
    }
    catch {
        return null;
    }
}
function unwrapTriageObject(obj) {
    const hasExpected = (o) => [
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
        if (inner &&
            typeof inner === 'object' &&
            !Array.isArray(inner) &&
            hasExpected(inner)) {
            return inner;
        }
    }
    return obj;
}
function firstNonEmptyString(obj, keys) {
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
function textFromAssistantMessage(message) {
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
    const chunks = [];
    for (const part of c) {
        if (part && typeof part === 'object' && 'text' in part) {
            const tx = part.text;
            if (typeof tx === 'string') {
                chunks.push(tx);
            }
        }
    }
    const joined = chunks.join('').trim();
    return joined || undefined;
}
const JSON_DISCLAIMER = 'This is an AI-generated suggestion and not a substitute for professional medical advice.';
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
const DEFAULT_GROQ_MODEL = 'llama3-8b-8192';
const GROQ_REQUEST_TIMEOUT_MS = 90_000;
let AiService = AiService_1 = class AiService {
    http;
    log = new common_1.Logger(AiService_1.name);
    constructor(http) {
        this.http = http;
    }
    analyze(user, symptoms) {
        if (user.role !== 'PATIENT') {
            throw new common_1.UnauthorizedException('Only patients can use symptom analysis');
        }
        const groqKey = process.env.GROQ_API_KEY?.trim();
        if (!groqKey) {
            throw new common_1.ServiceUnavailableException('Symptom analysis is not configured (missing GROQ_API_KEY).');
        }
        return this.callGroq(symptoms, groqKey);
    }
    async callGroq(symptoms, apiKey) {
        const base = (process.env.GROQ_BASE_URL ?? DEFAULT_GROQ_BASE).replace(/\/$/, '');
        const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
        const url = `${base}/chat/completions`;
        const userText = `Patient symptom description:\n${symptoms}`;
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userText },
        ];
        const axiosOpts = {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: GROQ_REQUEST_TIMEOUT_MS,
        };
        try {
            let data;
            try {
                const res = await (0, rxjs_1.firstValueFrom)(this.http.post(url, {
                    model,
                    temperature: 0.25,
                    max_tokens: 2048,
                    response_format: { type: 'json_object' },
                    messages,
                }, axiosOpts));
                data = res.data;
            }
            catch (first) {
                const st = first.response
                    ?.status;
                if (st === 400) {
                    this.log.debug('Groq json_object rejected; retrying without it.');
                    const res = await (0, rxjs_1.firstValueFrom)(this.http.post(url, {
                        model,
                        temperature: 0.25,
                        max_tokens: 2048,
                        messages,
                    }, axiosOpts));
                    data = res.data;
                }
                else {
                    throw first;
                }
            }
            const choice = data.choices?.[0];
            const message = choice?.message;
            const raw = message ? textFromAssistantMessage(message) : undefined;
            if (!raw && choice?.finish_reason) {
                this.log.warn(`Groq finished with reason=${choice.finish_reason}`);
            }
            if (!raw) {
                this.log.warn('Groq returned no usable message content.');
                throw new common_1.BadGatewayException('The AI service did not return an analysis. Try again or shorten your description.');
            }
            const parsed = parseModelJsonObject(raw);
            if (!parsed) {
                this.log.warn(`Groq JSON parse failed; raw preview: ${raw.slice(0, 200)}…`);
                throw new common_1.BadGatewayException('The AI response could not be read. Please try again.');
            }
            return this.normalize(parsed);
        }
        catch (err) {
            if (err instanceof common_1.BadGatewayException) {
                throw err;
            }
            const ax = err;
            const detail = ax.response?.data
                ? JSON.stringify(ax.response.data).slice(0, 800)
                : (ax.message ?? String(err));
            this.log.warn(`Groq request failed (status ${ax.response?.status ?? 'n/a'}): ${detail}`);
            throw new common_1.BadGatewayException('Unable to reach the AI analysis service. Try again later.');
        }
    }
    normalize(parsed) {
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
        let recommendedSpecialty = firstNonEmptyString(root, [
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
        }
        else if (u === 'medium' || u.startsWith('medium')) {
            urgencyLevel = 'Medium';
        }
        else if (u === 'high' || u.startsWith('high')) {
            urgencyLevel = 'High';
        }
        else if (!['Low', 'Medium', 'High'].includes(urgencyLevel)) {
            urgencyLevel = 'Medium';
        }
        const uFinal = urgencyLevel;
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
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AiService);
//# sourceMappingURL=ai.service.js.map