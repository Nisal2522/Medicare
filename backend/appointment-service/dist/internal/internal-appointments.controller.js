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
exports.InternalAppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("../appointments/appointments.service");
const internal_key_guard_1 = require("./internal-key.guard");
let InternalAppointmentsController = class InternalAppointmentsController {
    appointments;
    constructor(appointments) {
        this.appointments = appointments;
    }
    telecomSnapshot(id) {
        return this.appointments.getTelecomSnapshot(id);
    }
    paymentPreview(id) {
        return this.appointments.getPaymentPreviewForCheckout(id);
    }
    summarySnapshot(id) {
        return this.appointments.getSummarySnapshot(id);
    }
    async confirmPayment(id) {
        await this.appointments.confirmPaymentSuccess(id);
        return { ok: true };
    }
};
exports.InternalAppointmentsController = InternalAppointmentsController;
__decorate([
    (0, common_1.Get)(':id/telecom-snapshot'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InternalAppointmentsController.prototype, "telecomSnapshot", null);
__decorate([
    (0, common_1.Get)(':id/payment-preview'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InternalAppointmentsController.prototype, "paymentPreview", null);
__decorate([
    (0, common_1.Get)(':id/summary-snapshot'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InternalAppointmentsController.prototype, "summarySnapshot", null);
__decorate([
    (0, common_1.Post)(':id/confirm-payment'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InternalAppointmentsController.prototype, "confirmPayment", null);
exports.InternalAppointmentsController = InternalAppointmentsController = __decorate([
    (0, common_1.Controller)('internal/appointments'),
    (0, common_1.UseGuards)(internal_key_guard_1.InternalKeyGuard),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], InternalAppointmentsController);
//# sourceMappingURL=internal-appointments.controller.js.map