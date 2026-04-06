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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelecomService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const agora_access_token_1 = require("agora-access-token");
const mongoose_2 = require("mongoose");
const appointment_schema_1 = require("../appointments/appointment.schema");
const TOKEN_TTL_SECONDS = 3600;
let TelecomService = class TelecomService {
    appointmentModel;
    config;
    constructor(appointmentModel, config) {
        this.appointmentModel = appointmentModel;
        this.config = config;
    }
    async getRtcToken(user, channelName) {
        const appId = this.config.get('AGORA_APP_ID')?.trim() ||
            process.env.AGORA_APP_ID?.trim() ||
            '';
        const appCertificate = this.config.get('AGORA_APP_CERTIFICATE')?.trim() ||
            process.env.AGORA_APP_CERTIFICATE?.trim() ||
            '';
        if (!appId || !appCertificate) {
            throw new common_1.BadRequestException('Agora is not configured (AGORA_APP_ID / AGORA_APP_CERTIFICATE). Set them in telemedicine-service/.env and restart the service.');
        }
        const trimmed = channelName.trim();
        if (!mongoose_2.Types.ObjectId.isValid(trimmed)) {
            throw new common_1.BadRequestException('channelName must be a valid appointment id (Mongo ObjectId)');
        }
        return this.buildTokenForAppointment(user, trimmed, appId, appCertificate);
    }
    async buildTokenForAppointment(user, appointmentId, appId, appCertificate) {
        const appt = await this.loadAppointmentForTelecom(appointmentId);
        if (!appt) {
            throw new common_1.NotFoundException('Appointment not found. Start appointment-service, set APPOINTMENT_SERVICE_URL and INTERNAL_SERVICE_KEY (same key as appointment-service), or point MONGO_URI at the same database as appointment-service.');
        }
        if (appt.status === 'PENDING_PAYMENT') {
            throw new common_1.ForbiddenException('Complete payment for this appointment before joining the video call');
        }
        if (this.effectiveDoctorApproval(appt) !== 'APPROVED') {
            throw new common_1.ForbiddenException('The doctor has not approved this visit yet. Join is available after approval.');
        }
        this.assertParticipant(user, appt);
        const uid = this.uidFromSub(user.sub);
        const privilegeExpiredTs = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
        const token = agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, appointmentId, uid, agora_access_token_1.RtcRole.PUBLISHER, privilegeExpiredTs);
        return {
            token,
            appId,
            channelName: appointmentId,
            uid,
            expiresIn: TOKEN_TTL_SECONDS,
            expiresAt: privilegeExpiredTs,
        };
    }
    effectiveDoctorApproval(appt) {
        const v = appt.doctorApprovalStatus?.trim();
        if (v === 'APPROVED' || v === 'PENDING' || v === 'REJECTED')
            return v;
        const st = appt.status ?? '';
        if (st === 'CONFIRMED' || st === 'COMPLETED')
            return 'APPROVED';
        return 'PENDING';
    }
    async loadAppointmentForTelecom(appointmentId) {
        const local = await this.appointmentModel.findById(appointmentId).lean().exec();
        if (local) {
            const l = local;
            return {
                doctorId: l.doctorId,
                patientId: l.patientId,
                patientEmail: l.patientEmail,
                status: l.status ?? '',
                doctorApprovalStatus: this.effectiveDoctorApproval(l),
            };
        }
        return this.fetchAppointmentFromAppointmentService(appointmentId);
    }
    async fetchAppointmentFromAppointmentService(appointmentId) {
        const base = this.config.get('APPOINTMENT_SERVICE_URL')?.trim();
        const key = this.config.get('INTERNAL_SERVICE_KEY')?.trim();
        if (!base || !key)
            return null;
        const url = `${base.replace(/\/$/, '')}/internal/appointments/${encodeURIComponent(appointmentId)}/telecom-snapshot`;
        try {
            const res = await fetch(url, {
                headers: { 'X-Service-Key': key },
            });
            if (res.status === 404)
                return null;
            if (!res.ok)
                return null;
            const data = (await res.json());
            return {
                doctorId: data.doctorId,
                patientId: data.patientId,
                patientEmail: data.patientEmail,
                status: data.status,
                doctorApprovalStatus: this.effectiveDoctorApproval(data),
            };
        }
        catch {
            return null;
        }
    }
    assertParticipant(user, appt) {
        const email = user.email.toLowerCase();
        if (user.role === 'PATIENT') {
            const byId = appt.patientId != null && String(appt.patientId) === user.sub;
            const byEmail = appt.patientEmail === email;
            if (byId || byEmail)
                return;
            throw new common_1.ForbiddenException('Not a participant of this appointment');
        }
        if (user.role === 'DOCTOR') {
            if (String(appt.doctorId) === user.sub)
                return;
            throw new common_1.ForbiddenException('Not a participant of this appointment');
        }
        throw new common_1.ForbiddenException('Only PATIENT or DOCTOR roles may join a call');
    }
    uidFromSub(sub) {
        let h = 2166136261;
        for (let i = 0; i < sub.length; i++) {
            h ^= sub.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        const u = h >>> 0;
        return u === 0 ? 1 : u;
    }
};
exports.TelecomService = TelecomService;
exports.TelecomService = TelecomService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(appointment_schema_1.AppointmentRef.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService])
], TelecomService);
//# sourceMappingURL=telecom.service.js.map