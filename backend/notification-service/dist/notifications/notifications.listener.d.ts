import { NotificationDispatcherService } from './notification-dispatcher.service';
export declare class NotificationsListener {
    private readonly dispatcher;
    private readonly logger;
    constructor(dispatcher: NotificationDispatcherService);
    onAppointmentCreated(data: {
        patientEmail: string;
        patientPhone?: string;
        doctorPhone?: string;
        doctorEmail?: string;
        appointment: Record<string, unknown>;
    }): Promise<void>;
    onVideoReminder(data: {
        patientEmail: string;
        patientPhone?: string;
        doctorPhone?: string;
        doctorEmail?: string;
        appointment: Record<string, unknown>;
    }): Promise<void>;
    onPrescriptionReady(data: {
        patientEmail: string;
        patientPhone?: string;
        doctorName?: string;
        appointmentId: string;
        prescription: Record<string, unknown>;
    }): Promise<void>;
    onDoctorApproval(data: {
        patientEmail: string;
        patientPhone?: string;
        doctorName?: string;
        appointment: Record<string, unknown>;
    }): Promise<void>;
}
