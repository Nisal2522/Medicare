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
exports.UploadReportBodyDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
function trimOrUndef(v) {
    if (v == null || v === '')
        return undefined;
    const s = String(v).trim();
    return s === '' ? undefined : s;
}
class UploadReportBodyDto {
    title;
    category;
    doctorName;
    specialty;
}
exports.UploadReportBodyDto = UploadReportBodyDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadReportBodyDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['prescription', 'blood', 'imaging', 'general']),
    __metadata("design:type", String)
], UploadReportBodyDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadReportBodyDto.prototype, "doctorName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadReportBodyDto.prototype, "specialty", void 0);
//# sourceMappingURL=upload-report-body.dto.js.map