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
exports.DoctorSearchQueryDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class DoctorSearchQueryDto {
    name;
    specialty;
    availability;
    day;
    location;
}
exports.DoctorSearchQueryDto = DoctorSearchQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        const s = String(value).trim();
        return s === '' ? undefined : s;
    }),
    __metadata("design:type", String)
], DoctorSearchQueryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        const s = String(value).trim();
        return s === '' ? undefined : s;
    }),
    __metadata("design:type", String)
], DoctorSearchQueryDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['true', 'false'], { message: 'availability must be "true" or "false"' }),
    __metadata("design:type", String)
], DoctorSearchQueryDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        const s = String(value).trim();
        return s === '' ? undefined : s;
    }),
    __metadata("design:type", String)
], DoctorSearchQueryDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null)
            return undefined;
        const s = String(value).trim();
        return s === '' ? undefined : s;
    }),
    __metadata("design:type", String)
], DoctorSearchQueryDto.prototype, "location", void 0);
//# sourceMappingURL=doctor-search-query.dto.js.map