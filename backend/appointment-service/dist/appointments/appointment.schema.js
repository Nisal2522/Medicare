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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentSchema = exports.Appointment = exports.DoctorApprovalStatus = exports.AppointmentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["PENDING"] = "PENDING";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var DoctorApprovalStatus;
(function (DoctorApprovalStatus) {
    DoctorApprovalStatus["PENDING"] = "PENDING";
    DoctorApprovalStatus["APPROVED"] = "APPROVED";
    DoctorApprovalStatus["REJECTED"] = "REJECTED";
})(DoctorApprovalStatus || (exports.DoctorApprovalStatus = DoctorApprovalStatus = {}));
let Appointment = class Appointment {
    doctorId;
    doctorName;
    doctorSpecialty;
    patientId;
    patientEmail;
    patientName;
    patientPhone;
    doctorPhone;
    doctorEmail;
    appointmentDateKey;
    day;
    startTime;
    endTime;
    consultationFee;
    status;
    doctorApprovalStatus;
    paymentStatus;
    slotKey;
    slotSeat;
};
exports.Appointment = Appointment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Appointment.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "doctorSpecialty", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Appointment.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "patientEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "patientName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "patientPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Appointment.prototype, "doctorPhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, lowercase: true }),
    __metadata("design:type", String)
], Appointment.prototype, "doctorEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appointment.prototype, "appointmentDateKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appointment.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appointment.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appointment.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Appointment.prototype, "consultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING_PAYMENT,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: DoctorApprovalStatus,
        default: DoctorApprovalStatus.PENDING,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "doctorApprovalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Pending payment' }),
    __metadata("design:type", String)
], Appointment.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Appointment.prototype, "slotKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 1 }),
    __metadata("design:type", Number)
], Appointment.prototype, "slotSeat", void 0);
exports.Appointment = Appointment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'appointments' })
], Appointment);
exports.AppointmentSchema = mongoose_1.SchemaFactory.createForClass(Appointment);
exports.AppointmentSchema.index({ doctorId: 1, appointmentDateKey: 1, slotKey: 1 });
exports.AppointmentSchema.index({ doctorId: 1, appointmentDateKey: 1, slotKey: 1, slotSeat: 1 }, {
    unique: true,
    partialFilterExpression: { slotSeat: { $type: 'number' } },
});
//# sourceMappingURL=appointment.schema.js.map