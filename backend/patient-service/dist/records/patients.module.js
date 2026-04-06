"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("../auth/jwt.strategy");
const medical_file_storage_service_1 = require("../storage/medical-file.storage.service");
const s3_service_1 = require("../storage/s3.service");
const medical_record_schema_1 = require("./medical-record.schema");
const patient_payment_schema_1 = require("./patient-payment.schema");
const patient_profile_schema_1 = require("./patient-profile.schema");
const patients_controller_1 = require("./patients.controller");
const patients_service_1 = require("./patients.service");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: medical_record_schema_1.MedicalRecord.name, schema: medical_record_schema_1.MedicalRecordSchema },
                { name: patient_profile_schema_1.PatientProfile.name, schema: patient_profile_schema_1.PatientProfileSchema },
                { name: patient_payment_schema_1.PatientPayment.name, schema: patient_payment_schema_1.PatientPaymentSchema },
            ]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET ?? 'change-me-secret',
                signOptions: { expiresIn: '1d' },
            }),
        ],
        controllers: [patients_controller_1.PatientsController],
        providers: [
            patients_service_1.PatientsService,
            s3_service_1.S3Service,
            medical_file_storage_service_1.MedicalFileStorageService,
            jwt_strategy_1.JwtStrategy,
        ],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map