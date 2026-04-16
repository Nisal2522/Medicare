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
var PaymentSuccessListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSuccessListener = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const appointments_service_1 = require("./appointments.service");
let PaymentSuccessListener = class PaymentSuccessListener {
    static { PaymentSuccessListener_1 = this; }
    appointments;
    logger = new common_1.Logger(PaymentSuccessListener_1.name);
    static PAYMENT_SUCCEEDED_V1 = 'PaymentSucceeded.v1';
    static PAYMENT_FAILED_V1 = 'PaymentFailed.v1';
    constructor(appointments) {
        this.appointments = appointments;
    }
    async onPaid(data) {
        this.logger.log(`payment_success for appointment ${data.appointmentId}`);
        await this.appointments.confirmPaymentSuccess(data.appointmentId);
    }
    async onPaidV1(event) {
        this.logger.log(`PaymentSucceeded.v1 for appointment ${event.appointmentId}`);
        await this.appointments.confirmPaymentSuccess(event.appointmentId);
    }
    async onFailedV1(event) {
        this.logger.warn(`PaymentFailed.v1 for appointment ${event.appointmentId}`);
        await this.appointments.markPaymentFailed(event);
    }
};
exports.PaymentSuccessListener = PaymentSuccessListener;
__decorate([
    (0, microservices_1.EventPattern)('payment_success'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentSuccessListener.prototype, "onPaid", null);
__decorate([
    (0, microservices_1.EventPattern)(PaymentSuccessListener.PAYMENT_SUCCEEDED_V1),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentSuccessListener.prototype, "onPaidV1", null);
__decorate([
    (0, microservices_1.EventPattern)(PaymentSuccessListener.PAYMENT_FAILED_V1),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentSuccessListener.prototype, "onFailedV1", null);
exports.PaymentSuccessListener = PaymentSuccessListener = PaymentSuccessListener_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], PaymentSuccessListener);
//# sourceMappingURL=payment-success.listener.js.map