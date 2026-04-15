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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const twilio_1 = __importDefault(require("twilio"));
let SmsService = SmsService_1 = class SmsService {
    config;
    logger = new common_1.Logger(SmsService_1.name);
    twilioClient = null;
    twilioFrom = null;
    constructor(config) {
        this.config = config;
        const sid = this.config.get('TWILIO_ACCOUNT_SID')?.trim();
        const token = this.config.get('TWILIO_AUTH_TOKEN')?.trim();
        const from = this.config.get('TWILIO_PHONE_NUMBER')?.trim();
        if (sid && token && from) {
            this.twilioClient = (0, twilio_1.default)(sid, token);
            this.twilioFrom = from;
            this.logger.log(`Twilio SMS enabled (from: ${from})`);
        }
        else {
            const missing = [
                !sid ? 'TWILIO_ACCOUNT_SID' : null,
                !token ? 'TWILIO_AUTH_TOKEN' : null,
                !from ? 'TWILIO_PHONE_NUMBER' : null,
            ]
                .filter(Boolean)
                .join(', ');
            this.logger.warn(`Twilio not configured (${missing}) — SMS will be mocked (console log only).`);
        }
    }
    normalizePhone(to) {
        const trimmed = to.trim().replace(/[()\-\s]/g, '');
        if (!trimmed)
            return '';
        if (trimmed.startsWith('+'))
            return trimmed;
        if (/^0\d{9}$/.test(trimmed)) {
            return `+94${trimmed.slice(1)}`;
        }
        if (/^94\d{9}$/.test(trimmed)) {
            return `+${trimmed}`;
        }
        return trimmed;
    }
    isE164(phone) {
        return /^\+[1-9]\d{7,14}$/.test(phone);
    }
    async send(to, body) {
        const n = to?.trim();
        const normalized = n ? this.normalizePhone(n) : '';
        if (!n) {
            this.logger.log(`SMS (no phone): ${body.slice(0, 120)}…`);
            return { success: false, provider: 'mock', error: 'Phone number missing' };
        }
        if (!this.isE164(normalized)) {
            const error = `Invalid phone format. Use E.164 (e.g. +94719839270). Received: ${n}`;
            this.logger.warn(error);
            return {
                success: false,
                provider: this.twilioClient ? 'twilio' : 'mock',
                to: normalized || n,
                error,
            };
        }
        if (this.twilioClient && this.twilioFrom) {
            try {
                const result = await this.twilioClient.messages.create({
                    from: this.twilioFrom,
                    to: normalized,
                    body,
                });
                this.logger.log(`SMS sent via Twilio to ${normalized}`);
                return {
                    success: true,
                    provider: 'twilio',
                    to: normalized,
                    sid: result.sid,
                };
            }
            catch (e) {
                const twilioError = e;
                const msg = twilioError.message ?? String(e);
                const code = twilioError.code;
                const status = twilioError.status;
                const moreInfo = twilioError.moreInfo;
                this.logger.error(`Twilio SMS failed for ${normalized} | code=${code ?? 'n/a'} status=${status ?? 'n/a'} message=${msg}${moreInfo ? ` | moreInfo=${moreInfo}` : ''}`);
                return {
                    success: false,
                    provider: 'twilio',
                    to: normalized,
                    code,
                    error: msg,
                };
            }
        }
        this.logger.log(`SMS sent to [${normalized}]: ${body}`);
        return { success: true, provider: 'mock', to: normalized };
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map