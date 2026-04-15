import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentAccess } from './appointment-access.schema';
import { MedicalFileStorageService } from '../storage/medical-file.storage.service';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
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
    @InjectModel(AppointmentAccess.name)
    private readonly appointmentAccessModel: Model<AppointmentAccess>,
    @InjectModel(MedicalRecord.name)
    private readonly recordModel: Model<MedicalRecord>,
    @InjectModel(PatientProfile.name)
    private readonly profileModel: Model<PatientProfile>,
    @InjectModel(PatientPayment.name)
    private readonly paymentModel: Model<PatientPayment>,
    private readonly medicalFileStorage: MedicalFileStorageService,
    private readonly config: ConfigService,
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

  async assertDoctorCanViewPatientReports(
    doctorId: string,
    patientId: string,
    appointmentId?: string,
  ) {
    if (!Types.ObjectId.isValid(doctorId) || !Types.ObjectId.isValid(patientId)) {
      throw new ForbiddenException('Access denied');
    }

    const doctorOid = new Types.ObjectId(doctorId);
    const patientOid = new Types.ObjectId(patientId);

    const approvedOrLegacyApproved = [
      { doctorApprovalStatus: 'APPROVED' },
      {
        doctorApprovalStatus: { $exists: false },
        status: { $in: ['CONFIRMED', 'COMPLETED'] },
      },
    ];

    if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
      const byAppointment = await this.appointmentAccessModel
        .findOne({
          _id: new Types.ObjectId(appointmentId),
          doctorId: doctorOid,
          status: { $ne: 'CANCELLED' },
          $or: approvedOrLegacyApproved,
        })
        .select({ _id: 1, patientId: 1 })
        .lean()
        .exec();

      if (byAppointment) {
        if (
          !byAppointment.patientId ||
          String(byAppointment.patientId) === patientId
        ) {
          return;
        }
      }
    }

    const row = await this.appointmentAccessModel
      .findOne({
        doctorId: doctorOid,
        patientId: patientOid,
        status: { $ne: 'CANCELLED' },
        $or: approvedOrLegacyApproved,
      })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (!row) {
      if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
        const allowedBySnapshot = await this.allowByAppointmentSnapshot(
          doctorId,
          patientId,
          appointmentId,
        );
        if (allowedBySnapshot) {
          return;
        }
      }
      throw new ForbiddenException(
        'Doctor can view records only after approving this patient appointment',
      );
    }
  }

  private effectiveDoctorApproval(raw?: string, status?: string): string {
    const approval = raw?.trim();
    if (
      approval === 'APPROVED' ||
      approval === 'PENDING' ||
      approval === 'REJECTED'
    ) {
      return approval;
    }
    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      return 'APPROVED';
    }
    return 'PENDING';
  }

  private async allowByAppointmentSnapshot(
    doctorId: string,
    patientId: string,
    appointmentId: string,
  ): Promise<boolean> {
    const base = this.config.get<string>('APPOINTMENT_SERVICE_URL')?.trim();
    const key = this.config.get<string>('INTERNAL_SERVICE_KEY')?.trim();
    if (!base || !key) {
      return false;
    }

    const url = `${base.replace(/\/$/, '')}/internal/appointments/${encodeURIComponent(
      appointmentId,
    )}/telecom-snapshot`;
    try {
      const res = await fetch(url, {
        headers: { 'X-Service-Key': key },
      });
      if (!res.ok) {
        return false;
      }
      const snapshot = (await res.json()) as {
        doctorId: string;
        patientId?: string;
        status?: string;
        doctorApprovalStatus?: string;
      };
      if (String(snapshot.doctorId) !== doctorId) {
        return false;
      }
      if (snapshot.status === 'CANCELLED') {
        return false;
      }
      const approval = this.effectiveDoctorApproval(
        snapshot.doctorApprovalStatus,
        snapshot.status,
      );
      if (approval !== 'APPROVED') {
        return false;
      }
      return !snapshot.patientId || String(snapshot.patientId) === patientId;
    } catch {
      return false;
    }
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
      age: typeof doc?.age === 'number' ? doc.age : null,
      gender: doc?.gender?.trim() ? doc.gender : null,
    };
  }

  async updatePatientProfile(patientId: string, body: UpdatePatientProfileDto) {
    if (!Types.ObjectId.isValid(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }
    const oid = new Types.ObjectId(patientId);
    const updateSet: {
      patientId: Types.ObjectId;
      age?: number;
      gender?: string;
    } = { patientId: oid };

    if (typeof body.age === 'number') {
      updateSet.age = body.age;
    }
    if (typeof body.gender === 'string') {
      updateSet.gender = body.gender;
    }

    const doc = await this.profileModel
      .findOneAndUpdate(
        { patientId: oid },
        { $set: updateSet },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    const avatarUrl = await this.medicalFileStorage.resolvePublicReadUrl(
      doc?.avatarUrl,
    );
    return {
      patientId,
      avatarUrl,
      age: typeof doc?.age === 'number' ? doc.age : null,
      gender: doc?.gender?.trim() ? doc.gender : null,
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
