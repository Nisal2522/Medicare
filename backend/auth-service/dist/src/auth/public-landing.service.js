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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicLandingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const role_enum_1 = require("./enums/role.enum");
const auth_repository_1 = require("./auth.repository");
const landing_partner_schema_1 = require("./schemas/landing-partner.schema");
const DEFAULT_PARTNER_NAMES = [
    'CareLink',
    'MediCore',
    'PulseHealth',
    'VitaLabs',
    'NorthCare',
];
let PublicLandingService = class PublicLandingService {
    authRepository;
    partnerModel;
    constructor(authRepository, partnerModel) {
        this.authRepository = authRepository;
        this.partnerModel = partnerModel;
    }
    async onModuleInit() {
        const n = await this.partnerModel.estimatedDocumentCount();
        if (n > 0)
            return;
        await this.partnerModel.insertMany(DEFAULT_PARTNER_NAMES.map((name, sortOrder) => ({ name, sortOrder })));
    }
    async getLandingSnapshot() {
        const [doctorCount, patientCount, partnerDocs] = await Promise.all([
            this.authRepository.countActiveByRole(role_enum_1.Role.DOCTOR),
            this.authRepository.countActiveByRole(role_enum_1.Role.PATIENT),
            this.partnerModel.find().sort({ sortOrder: 1 }).lean().exec(),
        ]);
        return {
            doctorCount,
            patientCount,
            partners: partnerDocs.map((p) => p.name),
        };
    }
};
exports.PublicLandingService = PublicLandingService;
exports.PublicLandingService = PublicLandingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(landing_partner_schema_1.LandingPartner.name)),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        mongoose_2.Model])
], PublicLandingService);
//# sourceMappingURL=public-landing.service.js.map