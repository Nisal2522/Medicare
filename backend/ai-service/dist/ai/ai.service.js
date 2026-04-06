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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const JSON_DISCLAIMER = 'This is an AI-generated suggestion and not a substitute for professional medical advice.';
const SYSTEM_PROMPT = `You are a cautious medical triage assistant. Based on the user's described symptoms, suggest:
1) the most likely general condition (plain language, not a definitive label),
2) which medical specialty they should consider consulting,
3) an urgency level: Low, Medium, or High (High if red flags like chest pain with shortness of breath, stroke signs, severe bleeding, or similar).

Prefer these specialty names when they fit: General Medicine, Cardiology, Dental, Pediatrics, Dermatology.

You must respond with ONLY valid JSON (no markdown) in this exact shape:
{"possibleCondition":"...","recommendedSpecialty":"...","urgencyLevel":"Low"|"Medium"|"High"}

${JSON_DISCLAIMER}`;
let AiService = class AiService {
    http;
    constructor(http) {
        this.http = http;
    }
    analyze(user, symptoms) {
        if (user.role !== 'PATIENT') {
            throw new common_1.UnauthorizedException('Only patients can use symptom analysis');
        }
        const key = process.env.OPENAI_API_KEY?.trim();
        if (!key) {
            return Promise.resolve(this.heuristicFallback(symptoms));
        }
        return this.callOpenAi(symptoms);
    }
    async callOpenAi(symptoms) {
        const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
        const url = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.post(url, {
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
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                timeout: 45_000,
            }));
            const raw = data.choices?.[0]?.message?.content;
            if (!raw) {
                return this.heuristicFallback(symptoms);
            }
            try {
                const parsed = JSON.parse(raw);
                return this.normalize(parsed);
            }
            catch {
                return this.heuristicFallback(symptoms);
            }
        }
        catch {
            return this.heuristicFallback(symptoms);
        }
    }
    normalize(parsed) {
        const possibleCondition = String(parsed.possibleCondition ?? 'Unspecified — seek clinician review').slice(0, 500);
        const recommendedSpecialty = String(parsed.recommendedSpecialty ?? 'General Medicine').slice(0, 120);
        let urgencyLevel = String(parsed.urgencyLevel ?? 'Low');
        if (!['Low', 'Medium', 'High'].includes(urgencyLevel)) {
            urgencyLevel = 'Medium';
        }
        return {
            possibleCondition,
            recommendedSpecialty,
            urgencyLevel: urgencyLevel,
            disclaimer: JSON_DISCLAIMER,
        };
    }
    heuristicFallback(symptoms) {
        const s = symptoms.toLowerCase();
        let specialty = 'General Medicine';
        let condition = 'Non-specific symptoms — clinical evaluation recommended';
        let urgency = 'Low';
        if (/chest|heart|palpitation|pressure\s*on\s*chest|short\s*of\s*breath|sob\b/.test(s)) {
            specialty = 'Cardiology';
            condition =
                'Possible cardiovascular-related symptoms — needs timely medical assessment';
            urgency = /crushing|severe|radiat|faint|sweat/.test(s) ? 'High' : 'Medium';
        }
        else if (/tooth|teeth|gum|dental|jaw\s*pain/.test(s)) {
            specialty = 'Dental';
            condition = 'Possible dental or oral issue';
        }
        else if (/skin|rash|itch|mole|dermat/.test(s)) {
            specialty = 'Dermatology';
            condition = 'Possible skin-related condition';
        }
        else if (/child|infant|toddler|baby/.test(s)) {
            specialty = 'Pediatrics';
            condition = 'Pediatric presentation — clinician guidance advised';
            urgency = 'Medium';
        }
        else if (/fever|severe|sudden|worst|blood|unconscious/.test(s)) {
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
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AiService);
//# sourceMappingURL=ai.service.js.map