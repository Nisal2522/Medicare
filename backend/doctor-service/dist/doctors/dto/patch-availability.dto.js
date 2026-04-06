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
exports.PatchAvailabilityDto = exports.DayAvailabilityInputDto = exports.AvailabilitySlotInputDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AvailabilitySlotInputDto {
    startTime;
    endTime;
    maxPatients;
}
exports.AvailabilitySlotInputDto = AvailabilitySlotInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilitySlotInputDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AvailabilitySlotInputDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AvailabilitySlotInputDto.prototype, "maxPatients", void 0);
class DayAvailabilityInputDto {
    day;
    closed;
    slots;
}
exports.DayAvailabilityInputDto = DayAvailabilityInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DayAvailabilityInputDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DayAvailabilityInputDto.prototype, "closed", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AvailabilitySlotInputDto),
    __metadata("design:type", Array)
], DayAvailabilityInputDto.prototype, "slots", void 0);
class PatchAvailabilityDto {
    days;
}
exports.PatchAvailabilityDto = PatchAvailabilityDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DayAvailabilityInputDto),
    __metadata("design:type", Array)
], PatchAvailabilityDto.prototype, "days", void 0);
//# sourceMappingURL=patch-availability.dto.js.map