import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MedicalFileStorageService } from '../storage/medical-file.storage.service';
import { MedicalRecord, MedicalRecordType } from './medical-record.schema';
import { PatientPayment, PaymentStatus } from './patient-payment.schema';
import { PatientProfile } from './patient-profile.schema';

const UPLOAD_CATEGORIES = ['prescription', 'blood', 'imaging', 'general'] as const;
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

export type PatientUploadMeta = {
  title?: string;
  category?: string;
  doctorName?: string;
  specialty?: string;
};

const AVATAR_SUBDIR = 'profile-avatars';
const DEMO_FILE_URL_PREFIX = 'https://example.com/reports/demo-';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(MedicalRecord.name)
    private readonly recordModel: Model<MedicalRecord>,
    @InjectModel(PatientProfile.name)
    private readonly profileModel: Model<PatientProfile>,
    @InjectModel(PatientPayment.name)
    private readonly paymentModel: Model<PatientPayment>,
    private readonly medicalFileStorage: MedicalFileStorageService,
  ) {}

  async uploadPatientReport(
    patientId: string,
    file: Express.Multer.File,
    meta: PatientUploadMeta,
  ) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }

    let category = meta.category?.trim().toLowerCase() ?? '';
    if (!UPLOAD_CATEGORIES.includes(category as UploadCategory)) {
      category = 'general';
    }

    const doctorName = (meta.doctorName?.trim() || 'Patient upload').slice(
      0,
      200,
    );

    const fileUrl = await this.medicalFileStorage.saveUploadedFile(file);
    const fileName = file.originalname || 'document';

    const type =
      category === 'prescription'
        ? MedicalRecordType.PRESCRIPTION
        : MedicalRecordType.REPORT;

    const doc = await this.recordModel.create({
      patientId: new Types.ObjectId(patientId),
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
      throw new BadRequestException('Record was not persisted');
    }

    const withTs = lean as typeof lean & { createdAt?: Date };
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

  async deletePatientRecord(patientId: string, recordId: string) {
    if (!Types.ObjectId.isValid(patientId) || !Types.ObjectId.isValid(recordId)) {
      throw new BadRequestException('Invalid id');
    }
    const pid = new Types.ObjectId(patientId);
    const rid = new Types.ObjectId(recordId);
    const existing = await this.recordModel
      .findOne({ _id: rid, patientId: pid })
      .lean()
      .exec();
    if (!existing) {
      throw new NotFoundException('Record not found');
    }
    await this.medicalFileStorage.removeStoredFile(existing.fileUrl);
    await this.recordModel.deleteOne({ _id: rid, patientId: pid }).exec();
    return { message: 'Document removed' };
  }

  async getRecordsForPatient(patientId: string) {
    const oid = new Types.ObjectId(patientId);
    const rows = await this.recordModel
      .find({ patientId: oid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows
      .filter((r) => !this.isDemoRecordUrl(r.fileUrl))
      .map((r) => this.mapRow(r));
  }

  async getPrescriptionsForPatient(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }
    const oid = new Types.ObjectId(patientId);
    const rows = await this.recordModel
      .find({ patientId: oid, type: MedicalRecordType.PRESCRIPTION })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows
      .filter((r) => !this.isDemoRecordUrl(r.fileUrl))
      .map((r) => this.mapRow(r));
  }

  async getPaymentsForPatient(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }
    const oid = new Types.ObjectId(patientId);
    const rows = await this.paymentModel
      .find({ patientId: oid })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return rows.map((p) => this.mapPayment(p));
  }

  async getPatientProfile(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }
    const oid = new Types.ObjectId(patientId);
    const doc = await this.profileModel.findOne({ patientId: oid }).lean().exec();
    const avatarUrl = await this.medicalFileStorage.resolvePublicReadUrl(
      doc?.avatarUrl,
    );
    return {
      patientId,
      avatarUrl,
    };
  }

  async uploadPatientAvatar(patientId: string, file: Express.Multer.File) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }
    const mime = file.mimetype?.toLowerCase() ?? '';
    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    const avatarUrl = await this.medicalFileStorage.saveUploadedFile(
      file,
      AVATAR_SUBDIR,
    );
    const oid = new Types.ObjectId(patientId);
    await this.profileModel.findOneAndUpdate(
      { patientId: oid },
      { $set: { patientId: oid, avatarUrl } },
      { upsert: true, new: true },
    );
    const readableAvatarUrl =
      await this.medicalFileStorage.resolvePublicReadUrl(avatarUrl);
    return { avatarUrl: readableAvatarUrl ?? avatarUrl };
  }

  private mapRow(r: {
    _id: Types.ObjectId;
    patientId: Types.ObjectId;
    type: MedicalRecordType;
    title: string;
    doctorName: string;
    specialty?: string;
    reportCategory?: string;
    fileName: string;
    fileUrl: string;
    createdAt?: Date;
  }) {
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

  private mapPayment(p: {
    _id: Types.ObjectId;
    patientId: Types.ObjectId;
    amountCents: number;
    currency: string;
    description: string;
    status: PaymentStatus;
    reference?: string;
    appointmentId?: string | null;
    createdAt?: Date;
  }) {
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

  private isDemoRecordUrl(fileUrl: string | undefined): boolean {
    const v = fileUrl?.trim() ?? '';
    return v.startsWith(DEMO_FILE_URL_PREFIX);
  }
}
