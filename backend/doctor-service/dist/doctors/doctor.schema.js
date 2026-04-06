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
exports.DoctorSchema = exports.Doctor = exports.AvailabilitySlotSchema = exports.AvailabilitySlot = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let AvailabilitySlot = class AvailabilitySlot {
    day;
    startTime;
    endTime;
    maxPatients;
    isAvailable;
};
exports.AvailabilitySlot = AvailabilitySlot;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "maxPatients", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AvailabilitySlot.prototype, "isAvailable", void 0);
exports.AvailabilitySlot = AvailabilitySlot = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AvailabilitySlot);
exports.AvailabilitySlotSchema = mongoose_1.SchemaFactory.createForClass(AvailabilitySlot);
let Doctor = class Doctor {
    name;
    specialty;
    experience;
    qualification;
    consultationFee;
    profilePicture;
    availability;
    location;
    hospital;
    isVerified;
};
exports.Doctor = Doctor;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Doctor.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Doctor.prototype, "specialty", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Doctor.prototype, "experience", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Doctor.prototype, "qualification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0 }),
    __metadata("design:type", Number)
], Doctor.prototype, "consultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Doctor.prototype, "profilePicture", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.AvailabilitySlotSchema], default: [] }),
    __metadata("design:type", Array)
], Doctor.prototype, "availability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Doctor.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Doctor.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Doctor.prototype, "isVerified", void 0);
exports.Doctor = Doctor = __decorate([
    (0, mongoose_1.Schema)({ collection: 'doctors', timestamps: true })
], Doctor);
exports.DoctorSchema = mongoose_1.SchemaFactory.createForClass(Doctor);
exports.DoctorSchema.index({ name: 1 });
exports.DoctorSchema.index({ specialty: 1 });
exports.DoctorSchema.index({ specialty: 1, name: 1 });
exports.DoctorSchema.index({ 'availability.day': 1, 'availability.isAvailable': 1 });
//# sourceMappingURL=doctor.schema.js.map