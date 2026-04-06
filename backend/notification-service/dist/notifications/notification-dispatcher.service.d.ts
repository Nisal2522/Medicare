import { MailService } from './mail.service';
import { SmsService } from './sms.service';
type AppointmentSlice = {
    id?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    patientName?: string;
    patientEmail?: string;
    appointmentDateKey?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
};
export declare class NotificationDispatcherService {
    private readonly mail;
    private readonly sms;
    private readonly logger;
    constructor(mail: MailService, sms: SmsService);
    onBookingConfirmation(payload: {
        patientEmail: string;
        patientPhone?: string;
        doctorPhone?: string;
        doctorEmail?: string;
        appointment: AppointmentSlice;
    }): Promise<void>;
    onVideoReminder(payload: {
        patientEmail: string;
        patientPhone?: string;
        doctorPhone?: string;
        doctorEmail?: string;
        appointment: AppointmentSlice;
    }): Promise<void>;
    onPrescriptionReady(payload: {
        patientEmail: string;
        patientPhone?: string;
        doctorName?: string;
        appointmentId: string;
        prescription: Record<string, unknown>;
    }): Promise<void>;
    onDoctorApproval(payload: {
        patientEmail: string;
        patientPhone?: string;
        doctorName?: string;
        appointment: AppointmentSlice;
    }): Promise<void>;
    private formatSlot;
    private esc;
    private wrapHtml;
}
export {};
