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
exports.PatientPaymentSchema = exports.PatientPayment = exports.PaymentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let PatientPayment = class PatientPayment {
    patientId;
    amountCents;
    currency;
    description;
    status;
    reference;
    appointmentId;
};
exports.PatientPayment = PatientPayment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PatientPayment.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], PatientPayment.prototype, "amountCents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'LKR', trim: true }),
    __metadata("design:type", String)
], PatientPayment.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PatientPayment.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: PaymentStatus, default: PaymentStatus.PAID }),
    __metadata("design:type", String)
], PatientPayment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], PatientPayment.prototype, "reference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PatientPayment.prototype, "appointmentId", void 0);
exports.PatientPayment = PatientPayment = __decorate([
    (0, mongoose_1.Schema)({ collection: 'patient_payments', timestamps: true })
], PatientPayment);
exports.PatientPaymentSchema = mongoose_1.SchemaFactory.createForClass(PatientPayment);
exports.PatientPaymentSchema.index({ patientId: 1, createdAt: -1 });
//# sourceMappingURL=patient-payment.schema.js.map