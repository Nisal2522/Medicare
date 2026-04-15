import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { NotificationStoreService } from './notification-store.service';

@Injectable()
export class RealtimeNotificationService {
  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly store: NotificationStoreService,
  ) {}

  async notifyPatientByEmail(
    patientEmail: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!patientEmail?.trim()) return;
    const email = patientEmail.trim().toLowerCase();
    const userId =
      this.extractString(payload.userId) ??
      this.extractString(payload.patientId) ??
      this.extractFromAppointment(payload, 'patientId');
    if (userId) {
      await this.store.push({
        userId,
        userEmail: email,
        type: event,
        title: this.extractTitle(payload, event),
        message: this.extractMessage(payload),
        meta: payload,
      });
    }
    this.gateway.emitToEmail(patientEmail, event, payload);
  }

  async notifyPatientById(
    patientId: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!patientId?.trim()) return;
    await this.store.push({
      userId: patientId.trim(),
      userEmail: this.extractString(payload.patientEmail),
      type: event,
      title: this.extractTitle(payload, event),
      message: this.extractMessage(payload),
      meta: payload,
    });
    this.gateway.emitToUser(patientId, event, payload);
  }

  async notifyDoctorById(
    doctorId: string | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!doctorId?.trim()) return;
    await this.store.push({
      userId: doctorId.trim(),
      userEmail: this.extractString(payload.doctorEmail),
      type: event,
      title: this.extractTitle(payload, event),
      message: this.extractMessage(payload),
      meta: payload,
    });
    this.gateway.emitToUser(doctorId, event, payload);
  }

  private extractTitle(payload: Record<string, unknown>, fallback: string): string {
    return this.extractString(payload.title) ?? fallback;
  }

  private extractMessage(payload: Record<string, unknown>): string {
    return this.extractString(payload.message) ?? '';
  }

  private extractString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private extractFromAppointment(
    payload: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const appt = payload.appointment as Record<string, unknown> | undefined;
    if (!appt) return undefined;
    return this.extractString(appt[key]);
  }
}
