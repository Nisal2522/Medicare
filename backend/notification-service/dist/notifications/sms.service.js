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
        const sid = this.config.get('TWILIO_ACCOUNT_SID');
        const token = this.config.get('TWILIO_AUTH_TOKEN');
        const from = this.config.get('TWILIO_PHONE_NUMBER');
        if (sid && token && from) {
            this.twilioClient = (0, twilio_1.default)(sid, token);
            this.twilioFrom = from;
            this.logger.log('Twilio SMS enabled');
        }
        else {
            this.logger.warn('Twilio not configured — SMS will be mocked (console log only).');
        }
    }
    async send(to, body) {
        const n = to?.trim();
        if (!n) {
            this.logger.log(`SMS (no phone): ${body.slice(0, 120)}…`);
            return;
        }
        if (this.twilioClient && this.twilioFrom) {
            try {
                await this.twilioClient.messages.create({
                    from: this.twilioFrom,
                    to: n,
                    body,
                });
                this.logger.log(`SMS sent via Twilio to ${n}`);
            }
            catch (e) {
                this.logger.warn(`SMS send failed for ${n}: ${String(e)}`);
            }
            return;
        }
        this.logger.log(`SMS sent to [${n}]: ${body}`);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map