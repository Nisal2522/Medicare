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
exports.MedicalRecordSchema = exports.MedicalRecord = exports.MedicalRecordType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var MedicalRecordType;
(function (MedicalRecordType) {
    MedicalRecordType["PRESCRIPTION"] = "prescription";
    MedicalRecordType["REPORT"] = "report";
})(MedicalRecordType || (exports.MedicalRecordType = MedicalRecordType = {}));
let MedicalRecord = class MedicalRecord {
    patientId;
    type;
    title;
    doctorName;
    specialty;
    reportCategory;
    fileName;
    fileUrl;
};
exports.MedicalRecord = MedicalRecord;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MedicalRecord.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: MedicalRecordType, required: true }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "specialty", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "reportCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "fileName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], MedicalRecord.prototype, "fileUrl", void 0);
exports.MedicalRecord = MedicalRecord = __decorate([
    (0, mongoose_1.Schema)({ collection: 'medical_records', timestamps: true })
], MedicalRecord);
exports.MedicalRecordSchema = mongoose_1.SchemaFactory.createForClass(MedicalRecord);
exports.MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
//# sourceMappingURL=medical-record.schema.js.map