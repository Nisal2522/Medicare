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
var NotificationsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsListener = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const notification_dispatcher_service_1 = require("./notification-dispatcher.service");
let NotificationsListener = NotificationsListener_1 = class NotificationsListener {
    dispatcher;
    logger = new common_1.Logger(NotificationsListener_1.name);
    constructor(dispatcher) {
        this.dispatcher = dispatcher;
    }
    async onUserRegistered(data) {
        this.logger.log(`user_registered → ${data.email}`);
        await this.dispatcher.onUserRegistered(data);
    }
    async onAppointmentCreated(data) {
        this.logger.log(`appointment_created → ${data.patientEmail}`);
        await this.dispatcher.onBookingConfirmation({
            patientEmail: data.patientEmail,
            patientPhone: data.patientPhone,
            doctorPhone: data.doctorPhone,
            doctorEmail: data.doctorEmail,
            appointment: data.appointment,
        });
    }
    async onVideoReminder(data) {
        this.logger.log(`video_call_reminder → ${data.patientEmail}`);
        await this.dispatcher.onVideoReminder(data);
    }
    async onPrescriptionReady(data) {
        this.logger.log(`prescription_ready → ${data.patientEmail}`);
        await this.dispatcher.onPrescriptionReady(data);
    }
    async onDoctorApproval(data) {
        this.logger.log(`appointment_doctor_approved → ${data.patientEmail}`);
        await this.dispatcher.onDoctorApproval({
            patientEmail: data.patientEmail,
            patientPhone: data.patientPhone,
            doctorName: data.doctorName,
            appointment: data.appointment,
        });
    }
    async onPaymentSuccess(data) {
        this.logger.log(`appointment_payment_success → ${data.patientEmail ?? 'unknown patient'}`);
        await this.dispatcher.onPaymentSuccess(data);
    }
};
exports.NotificationsListener = NotificationsListener;
__decorate([
    (0, microservices_1.EventPattern)('user_registered'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onUserRegistered", null);
__decorate([
    (0, microservices_1.EventPattern)('appointment_created'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onAppointmentCreated", null);
__decorate([
    (0, microservices_1.EventPattern)('video_call_reminder'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onVideoReminder", null);
__decorate([
    (0, microservices_1.EventPattern)('prescription_ready'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onPrescriptionReady", null);
__decorate([
    (0, microservices_1.EventPattern)('appointment_doctor_approved'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onDoctorApproval", null);
__decorate([
    (0, microservices_1.EventPattern)('appointment_payment_success'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsListener.prototype, "onPaymentSuccess", null);
exports.NotificationsListener = NotificationsListener = NotificationsListener_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [notification_dispatcher_service_1.NotificationDispatcherService])
], NotificationsListener);
//# sourceMappingURL=notifications.listener.js.map