import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';
import { Model, Types } from 'mongoose';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AppointmentRef } from '../appointments/appointment.schema';

const TOKEN_TTL_SECONDS = 3600;

type TelecomAppointment = {
  doctorId: Types.ObjectId | string;
  patientId?: Types.ObjectId | string;
  patientEmail: string;
  status: string;
  doctorApprovalStatus: string;
};

@Injectable()
export class TelecomService {
  constructor(
    @InjectModel(AppointmentRef.name)
    private readonly appointmentModel: Model<AppointmentRef>,
    private readonly config: ConfigService,
  ) {}

  async getRtcToken(user: JwtPayload, channelName: string) {
    const appId =
      this.config.get<string>('AGORA_APP_ID')?.trim() ||
      process.env.AGORA_APP_ID?.trim() ||
      '';
    const appCertificate =
      this.config.get<string>('AGORA_APP_CERTIFICATE')?.trim() ||
      process.env.AGORA_APP_CERTIFICATE?.trim() ||
      '';
    if (!appId || !appCertificate) {
      throw new BadRequestException(
        'Agora is not configured (AGORA_APP_ID / AGORA_APP_CERTIFICATE). Set them in telemedicine-service/.env and restart the service.',
      );
    }

    const trimmed = channelName.trim();
    if (!Types.ObjectId.isValid(trimmed)) {
      throw new BadRequestException(
        'channelName must be a valid appointment id (Mongo ObjectId)',
      );
    }

    return this.buildTokenForAppointment(user, trimmed, appId, appCertificate);
  }

  private async buildTokenForAppointment(
    user: JwtPayload,
    appointmentId: string,
    appId: string,
    appCertificate: string,
  ) {
    const appt = await this.loadAppointmentForTelecom(appointmentId);
    if (!appt) {
      throw new NotFoundException(
        'Appointment not found. Start appointment-service, set APPOINTMENT_SERVICE_URL and INTERNAL_SERVICE_KEY (same key as appointment-service), or point MONGO_URI at the same database as appointment-service.',
      );
    }

    if (appt.status === 'PENDING_PAYMENT') {
      throw new ForbiddenException(
        'Complete payment for this appointment before joining the video call',
      );
    }

    if (this.effectiveDoctorApproval(appt) !== 'APPROVED') {
      throw new ForbiddenException(
        'The doctor has not approved this visit yet. Join is available after approval.',
      );
    }

    this.assertParticipant(user, appt);

    const uid = this.uidFromSub(user.sub);
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      appointmentId,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
    );

    return {
      token,
      appId,
      channelName: appointmentId,
      uid,
      expiresIn: TOKEN_TTL_SECONDS,
      expiresAt: privilegeExpiredTs,
    };
  }

  private effectiveDoctorApproval(appt: {
    status?: string;
    doctorApprovalStatus?: string;
  }): string {
    const v = appt.doctorApprovalStatus?.trim();
    if (v === 'APPROVED' || v === 'PENDING' || v === 'REJECTED') return v;
    const st = appt.status ?? '';
    if (st === 'CONFIRMED' || st === 'COMPLETED') return 'APPROVED';
    return 'PENDING';
  }

  /** Local Mongo first; if missing, ask appointment-service (canonical store). */
  private async loadAppointmentForTelecom(
    appointmentId: string,
  ): Promise<TelecomAppointment | null> {
    const local = await this.appointmentModel.findById(appointmentId).lean().exec();
    if (local) {
      const l = local as {
        doctorId: Types.ObjectId;
        patientId?: Types.ObjectId;
        patientEmail: string;
        status?: string;
        doctorApprovalStatus?: string;
      };
      return {
        doctorId: l.doctorId,
        patientId: l.patientId,
        patientEmail: l.patientEmail,
        status: l.status ?? '',
        doctorApprovalStatus: this.effectiveDoctorApproval(l),
      };
    }
    return this.fetchAppointmentFromAppointmentService(appointmentId);
  }

  private async fetchAppointmentFromAppointmentService(
    appointmentId: string,
  ): Promise<TelecomAppointment | null> {
    const base = this.config.get<string>('APPOINTMENT_SERVICE_URL')?.trim();
    const key = this.config.get<string>('INTERNAL_SERVICE_KEY')?.trim();
    if (!base || !key) return null;
    const url = `${base.replace(/\/$/, '')}/internal/appointments/${encodeURIComponent(appointmentId)}/telecom-snapshot`;
    try {
      const res = await fetch(url, {
        headers: { 'X-Service-Key': key },
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const data = (await res.json()) as {
        doctorId: string;
        patientId?: string;
        patientEmail: string;
        status: string;
        doctorApprovalStatus?: string;
      };
      return {
        doctorId: data.doctorId,
        patientId: data.patientId,
        patientEmail: data.patientEmail,
        status: data.status,
        doctorApprovalStatus: this.effectiveDoctorApproval(data),
      };
    } catch {
      return null;
    }
  }

  private assertParticipant(user: JwtPayload, appt: TelecomAppointment) {
    const email = user.email.toLowerCase();

    if (user.role === 'PATIENT') {
      const byId =
        appt.patientId != null && String(appt.patientId) === user.sub;
      const byEmail = appt.patientEmail === email;
      if (byId || byEmail) return;
      throw new ForbiddenException('Not a participant of this appointment');
    }

    if (user.role === 'DOCTOR') {
      if (String(appt.doctorId) === user.sub) return;
      throw new ForbiddenException('Not a participant of this appointment');
    }

    throw new ForbiddenException('Only PATIENT or DOCTOR roles may join a call');
  }

  /** Stable uint32 uid for Agora (must match client join). */
  uidFromSub(sub: string): number {
    let h = 2166136261;
    for (let i = 0; i < sub.length; i++) {
      h ^= sub.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const u = h >>> 0;
    return u === 0 ? 1 : u;
  }
}
