import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  AppointmentSummarySnapshot,
  BookingSummaryDto,
  DoctorBasicSnapshot,
} from './contracts/booking-summary.contract';

@Injectable()
export class BookingSummaryService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getBookingSummary(appointmentId: string): Promise<BookingSummaryDto> {
    // Gateway orchestrates cross-service reads, while domain services own writes.
    const appointment = await this.fetchAppointmentSummary(appointmentId);
    const doctor = await this.fetchDoctor(appointment.doctorId);
    return {
      appointmentId: appointment.appointmentId,
      appointmentDateKey: appointment.appointmentDateKey,
      day: appointment.day,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      appointmentStatus: appointment.status,
      paymentStatus: appointment.paymentStatus,
      doctor,
    };
  }

  private async fetchAppointmentSummary(
    appointmentId: string,
  ): Promise<AppointmentSummarySnapshot> {
    const base =
      this.config.get<string>('APPOINTMENT_SERVICE_URL') ??
      'http://localhost:3003';
    const serviceKey =
      this.config.get<string>('INTERNAL_SERVICE_KEY') ?? 'dev-internal-key';
    const { data } = await firstValueFrom(
      this.http.get<AppointmentSummarySnapshot>(
        `${base.replace(/\/$/, '')}/internal/appointments/${appointmentId}/summary-snapshot`,
        { headers: { 'X-Service-Key': serviceKey } },
      ),
    );
    return data;
  }

  private async fetchDoctor(doctorId: string): Promise<DoctorBasicSnapshot> {
    const base =
      this.config.get<string>('DOCTOR_SERVICE_URL') ?? 'http://localhost:3000';
    const { data } = await firstValueFrom(
      this.http.get<DoctorBasicSnapshot>(
        `${base.replace(/\/$/, '')}/doctors/${doctorId}`,
      ),
    );
    return {
      id: data.id,
      name: data.name,
      specialty: data.specialty,
      profilePicture: data.profilePicture,
    };
  }
}

