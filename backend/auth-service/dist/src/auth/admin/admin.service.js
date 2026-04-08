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
exports.AdminService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const rxjs_1 = require("rxjs");
const role_enum_1 = require("../enums/role.enum");
const user_schema_1 = require("../schemas/user.schema");
let AdminService = class AdminService {
    userModel;
    http;
    constructor(userModel, http) {
        this.userModel = userModel;
        this.http = http;
    }
    async listUsers() {
        const rows = await this.userModel
            .find({ role: { $in: [role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR] } })
            .select('_id fullName email role isActive createdAt')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => {
            const row = r;
            return {
                id: String(row._id),
                fullName: row.fullName,
                email: row.email,
                role: row.role,
                isActive: row.isActive !== false,
                createdAt: row.createdAt
                    ? new Date(row.createdAt).toISOString()
                    : undefined,
            };
        });
    }
    async deactivateUser(actorSub, targetId) {
        if (actorSub === targetId) {
            throw new common_1.ForbiddenException('You cannot deactivate your own account');
        }
        const target = await this.userModel.findById(targetId).exec();
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.role === role_enum_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Cannot change admin accounts from this endpoint');
        }
        target.isActive = false;
        await target.save();
        await this.syncDoctorActivationIfNeeded(targetId, target.role, false);
        return { message: 'Account deactivated' };
    }
    async activateUser(actorSub, targetId) {
        if (actorSub === targetId) {
            throw new common_1.ForbiddenException('You cannot activate your own account from this endpoint');
        }
        const target = await this.userModel.findById(targetId).exec();
        if (!target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (target.role === role_enum_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Cannot change admin accounts from this endpoint');
        }
        target.isActive = true;
        await target.save();
        await this.syncDoctorActivationIfNeeded(targetId, target.role, true);
        return { message: 'Account activated' };
    }
    async getStats(authorization) {
        const [totalPatients, totalDoctors, newSignUpsToday] = await Promise.all([
            this.userModel.countDocuments({ role: role_enum_1.Role.PATIENT }),
            this.userModel.countDocuments({ role: role_enum_1.Role.DOCTOR }),
            this.countSignupsSinceUtcMidnight(),
        ]);
        let platform = {
            totalAppointments: 0,
            totalRevenue: 0,
            monthlyRevenue: [],
        };
        const base = process.env.APPOINTMENT_SERVICE_URL ?? 'http://localhost:3003';
        const url = `${base.replace(/\/$/, '')}/appointments/admin/platform-summary`;
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: { Authorization: authorization ?? '' },
                timeout: 12_000,
            }));
            platform = data;
        }
        catch {
        }
        return {
            totalPatients,
            totalDoctors,
            totalAppointments: platform.totalAppointments,
            totalRevenue: platform.totalRevenue,
            newSignUpsToday,
            monthlyRevenue: platform.monthlyRevenue ?? [],
        };
    }
    async countSignupsSinceUtcMidnight() {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        return this.userModel.countDocuments({
            createdAt: { $gte: start },
            role: { $in: [role_enum_1.Role.PATIENT, role_enum_1.Role.DOCTOR] },
        });
    }
    async verifyDoctor(authorization, doctorId) {
        const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
        const url = `${base.replace(/\/$/, '')}/admin/doctors/${doctorId}/verify`;
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.http.patch(url, {}, {
                headers: { Authorization: authorization ?? '' },
                timeout: 12_000,
            }));
            return data;
        }
        catch (e) {
            const err = e;
            if (err.response?.status === 404) {
                throw new common_1.NotFoundException('Doctor profile not found');
            }
            if (err.response?.status === 403) {
                throw new common_1.ForbiddenException('Not allowed to verify doctors');
            }
            throw new common_1.ServiceUnavailableException('Could not reach doctor service. Is it running?');
        }
    }
    async provisionDoctorProfile(userId, fullName) {
        const key = process.env.INTERNAL_SERVICE_KEY?.trim();
        if (!key) {
            throw new common_1.ServiceUnavailableException('Doctor onboarding is not configured (set INTERNAL_SERVICE_KEY and doctor service URL).');
        }
        const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
        const url = `${base.replace(/\/$/, '')}/internal/doctors/provision`;
        try {
            await (0, rxjs_1.firstValueFrom)(this.http.post(url, { userId, fullName }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Key': key,
                },
                timeout: 12_000,
            }));
        }
        catch (e) {
            const err = e;
            const msg = err.response?.data?.message ?? 'Doctor profile could not be created';
            throw new common_1.BadRequestException(typeof msg === 'string' ? msg : 'Doctor profile could not be created');
        }
    }
    async syncDoctorActivationIfNeeded(userId, role, isActive) {
        if (role !== role_enum_1.Role.DOCTOR) {
            return;
        }
        const key = process.env.INTERNAL_SERVICE_KEY?.trim();
        if (!key) {
            return;
        }
        const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
        const url = `${base.replace(/\/$/, '')}/internal/doctors/set-active`;
        try {
            await (0, rxjs_1.firstValueFrom)(this.http.post(url, { userId, isActive }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Key': key,
                },
                timeout: 12_000,
            }));
        }
        catch {
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        axios_1.HttpService])
], AdminService);
//# sourceMappingURL=admin.service.js.map