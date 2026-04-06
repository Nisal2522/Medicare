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
exports.DoctorsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const doctors_service_1 = require("./doctors.service");
const doctor_search_query_dto_1 = require("./dto/doctor-search-query.dto");
const patch_availability_dto_1 = require("./dto/patch-availability.dto");
const patch_doctor_profile_dto_1 = require("./dto/patch-doctor-profile.dto");
let DoctorsController = class DoctorsController {
    doctorsService;
    constructor(doctorsService) {
        this.doctorsService = doctorsService;
    }
    static avatarUploadLimits = {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
    };
    search(query) {
        return this.doctorsService.search(query);
    }
    patchAvailability(req, dto) {
        return this.doctorsService.updateAvailability(req.user.sub, req.user.role, dto);
    }
    patchProfile(req, dto) {
        return this.doctorsService.updateProfile(req.user.sub, req.user.role, dto);
    }
    findMe(req) {
        if (req.user.role !== 'DOCTOR') {
            throw new common_1.BadRequestException('Doctors only');
        }
        return this.doctorsService.findById(req.user.sub);
    }
    uploadProfilePhoto(req, file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.doctorsService.uploadProfilePhoto(req.user.sub, req.user.role, file);
    }
    findOne(id) {
        return this.doctorsService.findById(id);
    }
};
exports.DoctorsController = DoctorsController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [doctor_search_query_dto_1.DoctorSearchQueryDto]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "search", null);
__decorate([
    (0, common_1.Patch)('availability'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, patch_availability_dto_1.PatchAvailabilityDto]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "patchAvailability", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, patch_doctor_profile_dto_1.PatchDoctorProfileDto]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "patchProfile", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "findMe", null);
__decorate([
    (0, common_1.Post)('profile/photo'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', DoctorsController.avatarUploadLimits)),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "uploadProfilePhoto", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "findOne", null);
exports.DoctorsController = DoctorsController = __decorate([
    (0, common_1.Controller)('doctors'),
    __metadata("design:paramtypes", [doctors_service_1.DoctorsService])
], DoctorsController);
//# sourceMappingURL=doctors.controller.js.map