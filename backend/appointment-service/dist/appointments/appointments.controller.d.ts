import type { JwtPayload } from '../auth/jwt.strategy';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { DoctorApprovalDto } from './dto/doctor-approval.dto';
export declare class AppointmentsController {
    private readonly appointments;
    constructor(appointments: AppointmentsService);
    book(dto: BookAppointmentDto, authorization?: string): Promise<{
        message: string;
        appointment: ReturnType<AppointmentsService["mapRow"]>;
    }>;
    doctorApproval(id: string, dto: DoctorApprovalDto, req: {
        user: JwtPayload;
    }): Promise<{
        message: string;
        appointment: ReturnType<AppointmentsService["mapRow"]>;
    }>;
    cancel(id: string, dto: CancelAppointmentDto, authorization?: string): Promise<{
        message: string;
    }>;
    publicStats(): Promise<{
        consultationsToday: number;
        totalBookings: number;
        dateKey: string;
    }>;
    listByEmail(patientEmail?: string): Promise<{
        id: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string | undefined;
        patientId: string | undefined;
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        doctorPhone: string | undefined;
        doctorEmail: string | undefined;
        appointmentDateKey: string;
        day: string;
        startTime: string;
        endTime: string;
        consultationFee: number;
        status: string;
        paymentStatus: string;
        doctorApprovalStatus: import("./appointment.schema").DoctorApprovalStatus;
        createdAt: string | undefined;
    }[]>;
    listForPatient(patientId: string, req: {
        user: JwtPayload;
    }): Promise<{
        id: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string | undefined;
        patientId: string | undefined;
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        doctorPhone: string | undefined;
        doctorEmail: string | undefined;
        appointmentDateKey: string;
        day: string;
        startTime: string;
        endTime: string;
        consultationFee: number;
        status: string;
        paymentStatus: string;
        doctorApprovalStatus: import("./appointment.schema").DoctorApprovalStatus;
        createdAt: string | undefined;
    }[]>;
    listForDoctor(req: {
        user: JwtPayload;
    }, date?: string, fromDate?: string, limitRaw?: string): Promise<{
        id: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string | undefined;
        patientId: string | undefined;
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        doctorPhone: string | undefined;
        doctorEmail: string | undefined;
        appointmentDateKey: string;
        day: string;
        startTime: string;
        endTime: string;
        consultationFee: number;
        status: string;
        paymentStatus: string;
        doctorApprovalStatus: import("./appointment.schema").DoctorApprovalStatus;
        createdAt: string | undefined;
    }[]>;
    doctorStats(req: {
        user: JwtPayload;
    }, month?: string): Promise<{
        dateKey: string;
        monthKey: string;
        todayAppointmentCount: number;
        monthCompletedCount: number;
        monthEarningsTotal: number;
        pendingAppointmentCount: number;
        confirmedAppointmentCount: number;
        completedAppointmentCount: number;
        totalActiveAppointmentCount: number;
    }>;
    platformSummary(): Promise<{
        totalAppointments: number;
        totalRevenue: number;
        monthlyRevenue: {
            month: string;
            revenue: number;
        }[];
    }>;
    listAllForAdmin(limitRaw?: string): Promise<{
        id: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string | undefined;
        patientId: string | undefined;
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        doctorPhone: string | undefined;
        doctorEmail: string | undefined;
        appointmentDateKey: string;
        day: string;
        startTime: string;
        endTime: string;
        consultationFee: number;
        status: string;
        paymentStatus: string;
        doctorApprovalStatus: import("./appointment.schema").DoctorApprovalStatus;
        createdAt: string | undefined;
    }[]>;
    listPaymentsForAdmin(limitRaw?: string): Promise<{
        id: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string | undefined;
        patientId: string | undefined;
        patientEmail: string;
        patientName: string;
        patientPhone: string | undefined;
        doctorPhone: string | undefined;
        doctorEmail: string | undefined;
        appointmentDateKey: string;
        day: string;
        startTime: string;
        endTime: string;
        consultationFee: number;
        status: string;
        paymentStatus: string;
        doctorApprovalStatus: import("./appointment.schema").DoctorApprovalStatus;
        createdAt: string | undefined;
    }[]>;
}
