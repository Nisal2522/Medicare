import { AppointmentsService } from '../appointments/appointments.service';
export declare class InternalAppointmentsController {
    private readonly appointments;
    constructor(appointments: AppointmentsService);
    telecomSnapshot(id: string): Promise<{
        doctorId: string;
        patientId?: string;
        patientEmail: string;
        status: string;
        doctorApprovalStatus: import("../appointments/appointment.schema").DoctorApprovalStatus;
    }>;
    paymentPreview(id: string): Promise<{
        appointmentId: string;
        amountMinor: number;
        currency: string;
        patientEmail: string;
        status: string;
    }>;
    confirmPayment(id: string): Promise<{
        ok: boolean;
    }>;
}
