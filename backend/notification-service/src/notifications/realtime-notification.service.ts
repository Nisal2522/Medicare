import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeNotificationService {
  constructor(private readonly gateway: RealtimeGateway) {}

  notifyPatientByEmail(
    patientEmail: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    if (!patientEmail?.trim()) return;
    this.gateway.emitToEmail(patientEmail, event, payload);
  }

  notifyPatientById(
    patientId: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    if (!patientId?.trim()) return;
    this.gateway.emitToUser(patientId, event, payload);
  }

  notifyDoctorById(
    doctorId: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    if (!doctorId?.trim()) return;
    this.gateway.emitToUser(doctorId, event, payload);
  }
}
