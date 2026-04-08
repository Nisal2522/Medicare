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
exports.InternalDoctorsController = void 0;
const common_1 = require("@nestjs/common");
const doctors_service_1 = require("../doctors/doctors.service");
const provision_doctor_dto_1 = require("./dto/provision-doctor.dto");
const set_doctor_active_dto_1 = require("./dto/set-doctor-active.dto");
const internal_key_guard_1 = require("./internal-key.guard");
let InternalDoctorsController = class InternalDoctorsController {
    doctorsService;
    constructor(doctorsService) {
        this.doctorsService = doctorsService;
    }
    provision(dto) {
        return this.doctorsService.provisionFromAuth(dto.userId, dto.fullName);
    }
    setActive(dto) {
        return this.doctorsService.setActiveByInternal(dto.userId, dto.isActive);
    }
};
exports.InternalDoctorsController = InternalDoctorsController;
__decorate([
    (0, common_1.Post)('provision'),
    (0, common_1.UseGuards)(internal_key_guard_1.InternalKeyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [provision_doctor_dto_1.ProvisionDoctorDto]),
    __metadata("design:returntype", void 0)
], InternalDoctorsController.prototype, "provision", null);
__decorate([
    (0, common_1.Post)('set-active'),
    (0, common_1.UseGuards)(internal_key_guard_1.InternalKeyGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_doctor_active_dto_1.SetDoctorActiveDto]),
    __metadata("design:returntype", void 0)
], InternalDoctorsController.prototype, "setActive", null);
exports.InternalDoctorsController = InternalDoctorsController = __decorate([
    (0, common_1.Controller)('internal/doctors'),
    __metadata("design:paramtypes", [doctors_service_1.DoctorsService])
], InternalDoctorsController);
//# sourceMappingURL=internal-doctors.controller.js.map