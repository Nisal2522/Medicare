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
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const upload_report_body_dto_1 = require("./dto/upload-report-body.dto");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const patients_service_1 = require("./patients.service");
const uploadLimits = {
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: 15 * 1024 * 1024 },
};
const avatarUploadLimits = {
    storage: (0, multer_1.memoryStorage)(),
    limits: { fileSize: 5 * 1024 * 1024 },
};
let PatientsController = class PatientsController {
    patientsService;
    constructor(patientsService) {
        this.patientsService = patientsService;
    }
    async uploadReport(req, file, body) {
        if (req.user.role !== 'PATIENT') {
            throw new common_1.ForbiddenException('Only patients can upload reports');
        }
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.patientsService.uploadPatientReport(req.user.sub, file, {
            title: body?.title,
            category: body?.category,
            doctorName: body?.doctorName,
            specialty: body?.specialty,
        });
    }
    async uploadAvatar(req, file) {
        if (req.user.role !== 'PATIENT') {
            throw new common_1.ForbiddenException('Only patients can upload a profile photo');
        }
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.patientsService.uploadPatientAvatar(req.user.sub, file);
    }
    getProfile(req, patientId) {
        if (req.user.role === 'PATIENT') {
            if (req.user.sub !== patientId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.patientsService.getPatientProfile(patientId);
    }
    getRecords(req, patientId) {
        if (req.user.role === 'PATIENT') {
            if (req.user.sub !== patientId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (req.user.role === 'DOCTOR') {
        }
        else {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.patientsService.getRecordsForPatient(patientId);
    }
    deleteRecord(req, patientId, recordId) {
        if (req.user.role !== 'PATIENT') {
            throw new common_1.ForbiddenException('Only patients can delete their documents');
        }
        if (req.user.sub !== patientId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.patientsService.deletePatientRecord(patientId, recordId);
    }
    getPrescriptions(req, patientId) {
        if (req.user.role === 'PATIENT') {
            if (req.user.sub !== patientId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.patientsService.getPrescriptionsForPatient(patientId);
    }
    getPayments(req, patientId) {
        if (req.user.role === 'PATIENT') {
            if (req.user.sub !== patientId) {
                throw new common_1.ForbiddenException('Access denied');
            }
        }
        else if (req.user.role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.patientsService.getPaymentsForPatient(patientId);
    }
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Post)('upload-report'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', uploadLimits)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, upload_report_body_dto_1.UploadReportBodyDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "uploadReport", null);
__decorate([
    (0, common_1.Post)('upload-avatar'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', avatarUploadLimits)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/records'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "getRecords", null);
__decorate([
    (0, common_1.Delete)(':id/records/:recordId'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('recordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "deleteRecord", null);
__decorate([
    (0, common_1.Get)(':id/prescriptions'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "getPrescriptions", null);
__decorate([
    (0, common_1.Get)(':id/payments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientsController.prototype, "getPayments", null);
exports.PatientsController = PatientsController = __decorate([
    (0, common_1.Controller)('patients'),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map