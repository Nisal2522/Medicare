"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const admin_doctors_controller_1 = require("../admin/admin-doctors.controller");
const jwt_strategy_1 = require("../auth/jwt.strategy");
const roles_guard_1 = require("../auth/roles.guard");
const internal_doctors_controller_1 = require("../internal/internal-doctors.controller");
const internal_key_guard_1 = require("../internal/internal-key.guard");
const s3_service_1 = require("../storage/s3.service");
const doctor_schema_1 = require("./doctor.schema");
const doctor_repository_1 = require("./doctor.repository");
const doctors_controller_1 = require("./doctors.controller");
const doctors_service_1 = require("./doctors.service");
let DoctorsModule = class DoctorsModule {
};
exports.DoctorsModule = DoctorsModule;
exports.DoctorsModule = DoctorsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: doctor_schema_1.Doctor.name, schema: doctor_schema_1.DoctorSchema }]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET ?? 'change-me-secret',
                signOptions: { expiresIn: '1d' },
            }),
        ],
        controllers: [
            doctors_controller_1.DoctorsController,
            admin_doctors_controller_1.AdminDoctorsController,
            internal_doctors_controller_1.InternalDoctorsController,
        ],
        providers: [
            doctors_service_1.DoctorsService,
            s3_service_1.S3Service,
            doctor_repository_1.DoctorRepository,
            jwt_strategy_1.JwtStrategy,
            roles_guard_1.RolesGuard,
            internal_key_guard_1.InternalKeyGuard,
        ],
    })
], DoctorsModule);
//# sourceMappingURL=doctors.module.js.map