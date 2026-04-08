import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';
import { AppointmentsService } from '../appointments/appointments.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { IssuePrescriptionDto } from './dto/issue-prescription.dto';
import {
  Prescription,
  PrescriptionDocument,
} from './prescription.schema';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(Prescription.name)
    private readonly prescriptionModel: Model<PrescriptionDocument>,
    private readonly appointments: AppointmentsService,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notifications: ClientProxy,
  ) {}

  async issue(user: JwtPayload, dto: IssuePrescriptionDto) {
    const appt = await this.appointments.findByIdForPrescription(
      dto.appointmentId,
      user.sub,
    );

    const created = await this.prescriptionModel.create({
      patientId: appt.patientId,
      patientEmail: appt.patientEmail,
      doctorId: appt.doctorId,
      appointmentId: appt._id,
      diagnosis: dto.diagnosis.trim(),
      symptoms: dto.symptoms?.trim() || undefined,
      clinicalNotes: dto.clinicalNotes?.trim() || undefined,
      specialAdvice: dto.specialAdvice?.trim() || undefined,
      labTests: dto.labTests?.trim() || undefined,
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      patientName: dto.patientName?.trim() || appt.patientName,
      patientAge: dto.patientAge?.trim() || undefined,
      patientGender: dto.patientGender?.trim() || undefined,
      medicines: dto.medicines.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency?.trim() || undefined,
        duration: m.duration.trim(),
        instructions: m.instructions?.trim() || undefined,
      })),
    });

    await this.appointments.completeAfterPrescription(dto.appointmentId, user.sub);

    const o = created.toObject() as PrescriptionDocument & {
      createdAt?: Date;
    };
    const medicinesSummary = o.medicines
      .map((m) =>
        [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '),
      )
      .join(', ');
    const prescription = {
      id: String(o._id),
      patientId: o.patientId ? String(o.patientId) : undefined,
      patientEmail: o.patientEmail,
      doctorId: String(o.doctorId),
      appointmentId: String(o.appointmentId),
      diagnosis: o.diagnosis,
      symptoms: o.symptoms,
      clinicalNotes: o.clinicalNotes,
      specialAdvice: o.specialAdvice,
      labTests: o.labTests,
      followUpDate: o.followUpDate
        ? new Date(o.followUpDate as Date).toISOString()
        : undefined,
      patientName: o.patientName,
      patientAge: o.patientAge,
      patientGender: o.patientGender,
      medicines: o.medicines,
      medicinesSummary,
      createdAt: o.createdAt
        ? new Date(o.createdAt as Date).toISOString()
        : undefined,
    };

    this.notifications.emit('prescription_ready', {
      patientEmail: appt.patientEmail,
      patientPhone: appt.patientPhone,
      doctorName: appt.doctorName,
      appointmentId: String(appt._id),
      prescription,
    });

    return {
      message: 'Prescription issued',
      prescription,
    };
  }

  async listForDoctor(
    doctorSub: string,
    opts?: { q?: string; limit?: number },
  ): Promise<
    Array<{
      id: string;
      appointmentId: string;
      patientName?: string;
      patientEmail?: string;
      diagnosis: string;
      medicinesSummary: string;
      followUpDate?: string;
      createdAt?: string;
    }>
  > {
    const did = new Types.ObjectId(doctorSub);
    const q = opts?.q?.trim();
    const cap = Math.max(1, Math.min(100, Number(opts?.limit ?? 25)));

    const query: {
      doctorId: Types.ObjectId;
      $or?: Array<Record<string, unknown>>;
    } = { doctorId: did };

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { patientName: rx },
        { patientEmail: rx },
        { diagnosis: rx },
        { 'medicines.name': rx },
      ];
    }

    const rows = await this.prescriptionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean()
      .exec();

    return rows.map((o) => {
      const row = o as typeof o & { createdAt?: Date };
      return {
      id: String(o._id),
      appointmentId: String(o.appointmentId),
      patientName: o.patientName,
      patientEmail: o.patientEmail,
      diagnosis: o.diagnosis,
      medicinesSummary: (o.medicines ?? [])
        .map((m) =>
          [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '),
        )
        .join(', '),
      followUpDate: o.followUpDate
        ? new Date(o.followUpDate as Date).toISOString()
        : undefined,
      createdAt: row.createdAt
        ? new Date(row.createdAt as Date).toISOString()
        : undefined,
      };
    });
  }

  async listForPatient(
    patientSub: string,
    opts?: { q?: string; limit?: number },
  ): Promise<
    Array<{
      id: string;
      appointmentId: string;
      diagnosis: string;
      medicinesSummary: string;
      followUpDate?: string;
      createdAt?: string;
    }>
  > {
    const pid = new Types.ObjectId(patientSub);
    const q = opts?.q?.trim();
    const cap = Math.max(1, Math.min(100, Number(opts?.limit ?? 25)));

    const query: {
      patientId: Types.ObjectId;
      $or?: Array<Record<string, unknown>>;
    } = { patientId: pid };

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { diagnosis: rx },
        { symptoms: rx },
        { clinicalNotes: rx },
        { specialAdvice: rx },
        { 'medicines.name': rx },
      ];
    }

    const rows = await this.prescriptionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(cap)
      .lean()
      .exec();

    return rows.map((o) => {
      const row = o as typeof o & { createdAt?: Date };
      return {
        id: String(o._id),
        appointmentId: String(o.appointmentId),
        diagnosis: o.diagnosis,
        medicinesSummary: (o.medicines ?? [])
          .map((m) =>
            [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '),
          )
          .join(', '),
        followUpDate: o.followUpDate
          ? new Date(o.followUpDate as Date).toISOString()
          : undefined,
        createdAt: row.createdAt
          ? new Date(row.createdAt as Date).toISOString()
          : undefined,
      };
    });
  }

  async getForPatient(
    patientSub: string,
    prescriptionId: string,
  ): Promise<{
    id: string;
    appointmentId: string;
    diagnosis: string;
    symptoms?: string;
    clinicalNotes?: string;
    specialAdvice?: string;
    labTests?: string;
    followUpDate?: string;
    patientName?: string;
    patientAge?: string;
    patientGender?: string;
    medicines: Array<{
      name: string;
      dosage: string;
      frequency?: string;
      duration: string;
      instructions?: string;
    }>;
    medicinesSummary: string;
    createdAt?: string;
  }> {
    if (!Types.ObjectId.isValid(prescriptionId)) {
      throw new NotFoundException('Prescription not found');
    }
    const pid = new Types.ObjectId(patientSub);
    const rid = new Types.ObjectId(prescriptionId);
    const row = await this.prescriptionModel
      .findOne({ _id: rid, patientId: pid })
      .lean()
      .exec();

    if (!row) {
      throw new NotFoundException('Prescription not found');
    }

    const createdAtRow = row as typeof row & { createdAt?: Date };
    return {
      id: String(row._id),
      appointmentId: String(row.appointmentId),
      diagnosis: row.diagnosis,
      symptoms: row.symptoms,
      clinicalNotes: row.clinicalNotes,
      specialAdvice: row.specialAdvice,
      labTests: row.labTests,
      followUpDate: row.followUpDate
        ? new Date(row.followUpDate as Date).toISOString()
        : undefined,
      patientName: row.patientName,
      patientAge: row.patientAge,
      patientGender: row.patientGender,
      medicines: (row.medicines ?? []).map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
      medicinesSummary: (row.medicines ?? [])
        .map((m) =>
          [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '),
        )
        .join(', '),
      createdAt: createdAtRow.createdAt
        ? new Date(createdAtRow.createdAt as Date).toISOString()
        : undefined,
    };
  }

  async getForDoctor(
    doctorSub: string,
    prescriptionId: string,
  ): Promise<{
    id: string;
    patientId?: string;
    appointmentId: string;
    diagnosis: string;
    symptoms?: string;
    clinicalNotes?: string;
    specialAdvice?: string;
    labTests?: string;
    followUpDate?: string;
    patientName?: string;
    patientAge?: string;
    patientGender?: string;
    patientEmail?: string;
    medicines: Array<{
      name: string;
      dosage: string;
      frequency?: string;
      duration: string;
      instructions?: string;
    }>;
    medicinesSummary: string;
    createdAt?: string;
  }> {
    if (!Types.ObjectId.isValid(prescriptionId)) {
      throw new NotFoundException('Prescription not found');
    }
    const did = new Types.ObjectId(doctorSub);
    const rid = new Types.ObjectId(prescriptionId);
    const row = await this.prescriptionModel
      .findOne({ _id: rid, doctorId: did })
      .lean()
      .exec();

    if (!row) {
      throw new NotFoundException('Prescription not found');
    }

    const createdAtRow = row as typeof row & { createdAt?: Date };
    return {
      id: String(row._id),
      patientId: row.patientId ? String(row.patientId) : undefined,
      appointmentId: String(row.appointmentId),
      diagnosis: row.diagnosis,
      symptoms: row.symptoms,
      clinicalNotes: row.clinicalNotes,
      specialAdvice: row.specialAdvice,
      labTests: row.labTests,
      followUpDate: row.followUpDate
        ? new Date(row.followUpDate as Date).toISOString()
        : undefined,
      patientName: row.patientName,
      patientAge: row.patientAge,
      patientGender: row.patientGender,
      patientEmail: row.patientEmail,
      medicines: (row.medicines ?? []).map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
      medicinesSummary: (row.medicines ?? [])
        .map((m) =>
          [m.name, m.dosage, m.frequency, m.duration].filter(Boolean).join(' · '),
        )
        .join(', '),
      createdAt: createdAtRow.createdAt
        ? new Date(createdAtRow.createdAt as Date).toISOString()
        : undefined,
    };
  }
}
