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
exports.PrescriptionSchema = exports.Prescription = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Prescription = class Prescription {
    patientId;
    patientEmail;
    doctorId;
    doctorName;
    appointmentId;
    diagnosis;
    symptoms;
    clinicalNotes;
    specialAdvice;
    labTests;
    followUpDate;
    patientName;
    patientAge;
    patientGender;
    medicines;
};
exports.Prescription = Prescription;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Prescription.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "patientEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Prescription.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Prescription.prototype, "appointmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "diagnosis", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "symptoms", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "clinicalNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "specialAdvice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "labTests", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Prescription.prototype, "followUpDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "patientName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "patientAge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Prescription.prototype, "patientGender", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                dosage: { type: String, required: true },
                frequency: { type: String },
                duration: { type: String, required: true },
                instructions: { type: String },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Prescription.prototype, "medicines", void 0);
exports.Prescription = Prescription = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'prescriptions' })
], Prescription);
exports.PrescriptionSchema = mongoose_1.SchemaFactory.createForClass(Prescription);
//# sourceMappingURL=prescription.schema.js.map