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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const medical_file_storage_service_1 = require("../storage/medical-file.storage.service");
const medical_record_schema_1 = require("./medical-record.schema");
const patient_payment_schema_1 = require("./patient-payment.schema");
const patient_profile_schema_1 = require("./patient-profile.schema");
const UPLOAD_CATEGORIES = ['prescription', 'blood', 'imaging', 'general'];
const AVATAR_SUBDIR = 'profile-avatars';
const DEMO_FILE_URL_PREFIX = 'https://example.com/reports/demo-';
let PatientsService = class PatientsService {
    recordModel;
    profileModel;
    paymentModel;
    medicalFileStorage;
    constructor(recordModel, profileModel, paymentModel, medicalFileStorage) {
        this.recordModel = recordModel;
        this.profileModel = profileModel;
        this.paymentModel = paymentModel;
        this.medicalFileStorage = medicalFileStorage;
    }
    async uploadPatientReport(patientId, file, meta) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId)) {
            throw new common_1.BadRequestException('Invalid patient id');
        }
        let category = meta.category?.trim().toLowerCase() ?? '';
        if (!UPLOAD_CATEGORIES.includes(category)) {
            category = 'general';
        }
        const doctorName = (meta.doctorName?.trim() || 'Patient upload').slice(0, 200);
        const fileUrl = await this.medicalFileStorage.saveUploadedFile(file);
        const fileName = file.originalname || 'document';
        const type = category === 'prescription'
            ? medical_record_schema_1.MedicalRecordType.PRESCRIPTION
            : medical_record_schema_1.MedicalRecordType.REPORT;
        const doc = await this.recordModel.create({
            patientId: new mongoose_2.Types.ObjectId(patientId),
            type,
            title: (meta.title?.trim() || fileName).slice(0, 500),
            doctorName: doctorName.slice(0, 200),
            specialty: (meta.specialty?.trim() || '').slice(0, 200),
            reportCategory: category,
            fileName,
            fileUrl,
        });
        const lean = await this.recordModel.findById(doc._id).lean().exec();
        if (!lean) {
            throw new common_1.BadRequestException('Record was not persisted');
        }
        const withTs = lean;
        return this.mapRow({
            _id: lean._id,
            patientId: lean.patientId,
            type: lean.type,
            title: lean.title,
            doctorName: lean.doctorName,
            specialty: lean.specialty ?? '',
            reportCategory: lean.reportCategory ?? '',
            fileName: lean.fileName,
            fileUrl: lean.fileUrl,
            createdAt: withTs.createdAt,
        });
    }
    async deletePatientRecord(patientId, recordId) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId) || !mongoose_2.Types.ObjectId.isValid(recordId)) {
            throw new common_1.BadRequestException('Invalid id');
        }
        const pid = new mongoose_2.Types.ObjectId(patientId);
        const rid = new mongoose_2.Types.ObjectId(recordId);
        const existing = await this.recordModel
            .findOne({ _id: rid, patientId: pid })
            .lean()
            .exec();
        if (!existing) {
            throw new common_1.NotFoundException('Record not found');
        }
        await this.medicalFileStorage.removeStoredFile(existing.fileUrl);
        await this.recordModel.deleteOne({ _id: rid, patientId: pid }).exec();
        return { message: 'Document removed' };
    }
    async getRecordsForPatient(patientId) {
        const oid = new mongoose_2.Types.ObjectId(patientId);
        const rows = await this.recordModel
            .find({ patientId: oid })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows
            .filter((r) => !this.isDemoRecordUrl(r.fileUrl))
            .map((r) => this.mapRow(r));
    }
    async getPrescriptionsForPatient(patientId) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId)) {
            throw new common_1.BadRequestException('Invalid patient id');
        }
        const oid = new mongoose_2.Types.ObjectId(patientId);
        const rows = await this.recordModel
            .find({ patientId: oid, type: medical_record_schema_1.MedicalRecordType.PRESCRIPTION })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows
            .filter((r) => !this.isDemoRecordUrl(r.fileUrl))
            .map((r) => this.mapRow(r));
    }
    async getPaymentsForPatient(patientId) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId)) {
            throw new common_1.BadRequestException('Invalid patient id');
        }
        const oid = new mongoose_2.Types.ObjectId(patientId);
        const rows = await this.paymentModel
            .find({ patientId: oid })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((p) => this.mapPayment(p));
    }
    async getPatientProfile(patientId) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId)) {
            throw new common_1.BadRequestException('Invalid patient id');
        }
        const oid = new mongoose_2.Types.ObjectId(patientId);
        const doc = await this.profileModel.findOne({ patientId: oid }).lean().exec();
        const avatarUrl = await this.medicalFileStorage.resolvePublicReadUrl(doc?.avatarUrl);
        return {
            patientId,
            avatarUrl,
        };
    }
    async uploadPatientAvatar(patientId, file) {
        if (!mongoose_2.Types.ObjectId.isValid(patientId)) {
            throw new common_1.BadRequestException('Invalid patient id');
        }
        const mime = file.mimetype?.toLowerCase() ?? '';
        if (!mime.startsWith('image/')) {
            throw new common_1.BadRequestException('Only image files are allowed');
        }
        const avatarUrl = await this.medicalFileStorage.saveUploadedFile(file, AVATAR_SUBDIR);
        const oid = new mongoose_2.Types.ObjectId(patientId);
        await this.profileModel.findOneAndUpdate({ patientId: oid }, { $set: { patientId: oid, avatarUrl } }, { upsert: true, new: true });
        const readableAvatarUrl = await this.medicalFileStorage.resolvePublicReadUrl(avatarUrl);
        return { avatarUrl: readableAvatarUrl ?? avatarUrl };
    }
    mapRow(r) {
        return {
            id: String(r._id),
            patientId: String(r.patientId),
            type: r.type,
            title: r.title,
            doctorName: r.doctorName,
            specialty: r.specialty ?? '',
            reportCategory: r.reportCategory ?? '',
            fileName: r.fileName,
            fileUrl: r.fileUrl,
            createdAt: r.createdAt,
        };
    }
    mapPayment(p) {
        return {
            id: String(p._id),
            patientId: String(p.patientId),
            amountCents: p.amountCents,
            currency: p.currency,
            description: p.description,
            status: p.status,
            reference: p.reference ?? '',
            appointmentId: p.appointmentId ?? null,
            createdAt: p.createdAt,
        };
    }
    isDemoRecordUrl(fileUrl) {
        const v = fileUrl?.trim() ?? '';
        return v.startsWith(DEMO_FILE_URL_PREFIX);
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(medical_record_schema_1.MedicalRecord.name)),
    __param(1, (0, mongoose_1.InjectModel)(patient_profile_schema_1.PatientProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(patient_payment_schema_1.PatientPayment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        medical_file_storage_service_1.MedicalFileStorageService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map