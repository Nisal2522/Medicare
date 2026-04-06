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
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_role_guard_1 = require("../auth/admin-role.guard");
const appointments_service_1 = require("./appointments.service");
const book_appointment_dto_1 = require("./dto/book-appointment.dto");
const cancel_appointment_dto_1 = require("./dto/cancel-appointment.dto");
const doctor_approval_dto_1 = require("./dto/doctor-approval.dto");
let AppointmentsController = class AppointmentsController {
    appointments;
    constructor(appointments) {
        this.appointments = appointments;
    }
    book(dto, authorization) {
        return this.appointments.book(dto, authorization);
    }
    doctorApproval(id, dto, req) {
        if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Doctors only');
        }
        return this.appointments.setDoctorApproval(id, req.user.sub, dto.decision);
    }
    cancel(id, dto, authorization) {
        return this.appointments.cancelByPatient(id, dto.patientEmail, authorization);
    }
    publicStats() {
        return this.appointments.getPublicStats();
    }
    listByEmail(patientEmail) {
        if (!patientEmail?.trim()) {
            throw new common_1.ForbiddenException('patientEmail query required');
        }
        return this.appointments.listByPatientEmail(patientEmail);
    }
    listForPatient(patientId, req) {
        if (req.user.role !== 'PATIENT') {
            throw new common_1.ForbiddenException('Patients only');
        }
        return this.appointments.listForPatient(patientId, req.user.sub, req.user.email);
    }
    listForDoctor(req, date, fromDate, limitRaw) {
        if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Doctors only');
        }
        const limit = limitRaw
            ? Math.min(200, Math.max(1, Number.parseInt(limitRaw, 10) || 0))
            : undefined;
        return this.appointments.listForDoctor(req.user.sub, {
            date: date?.trim(),
            fromDate: fromDate?.trim(),
            limit: limit && limit > 0 ? limit : undefined,
        });
    }
    doctorStats(req, month) {
        if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Doctors only');
        }
        return this.appointments.getDoctorStats(req.user.sub, month);
    }
    platformSummary() {
        return this.appointments.getPlatformSummary();
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Post)('book'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [book_appointment_dto_1.BookAppointmentDto, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "book", null);
__decorate([
    (0, common_1.Post)(':id/doctor-approval'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, doctor_approval_dto_1.DoctorApprovalDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "doctorApproval", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancel_appointment_dto_1.CancelAppointmentDto, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('public/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "publicStats", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('patientEmail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "listByEmail", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "listForPatient", null);
__decorate([
    (0, common_1.Get)('doctor/me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('fromDate')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "listForDoctor", null);
__decorate([
    (0, common_1.Get)('doctor/me/stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "doctorStats", null);
__decorate([
    (0, common_1.Get)('admin/platform-summary'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), admin_role_guard_1.AdminRoleGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "platformSummary", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map