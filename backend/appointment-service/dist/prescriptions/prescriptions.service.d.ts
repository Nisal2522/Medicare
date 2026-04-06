import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { AppointmentsService } from '../appointments/appointments.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { IssuePrescriptionDto } from './dto/issue-prescription.dto';
import { PrescriptionDocument } from './prescription.schema';
export declare class PrescriptionsService {
    private readonly prescriptionModel;
    private readonly appointments;
    private readonly notifications;
    constructor(prescriptionModel: Model<PrescriptionDocument>, appointments: AppointmentsService, notifications: ClientProxy);
    issue(user: JwtPayload, dto: IssuePrescriptionDto): Promise<{
        message: string;
        prescription: {
            id: string;
            patientId: string | undefined;
            patientEmail: string;
            doctorId: string;
            appointmentId: string;
            diagnosis: string;
            symptoms: string | undefined;
            clinicalNotes: string | undefined;
            specialAdvice: string | undefined;
            labTests: string | undefined;
            followUpDate: string | undefined;
            patientName: string | undefined;
            patientAge: string | undefined;
            patientGender: string | undefined;
            medicines: {
                name: string;
                dosage: string;
                frequency?: string;
                duration: string;
                instructions?: string;
            }[];
            medicinesSummary: string;
            createdAt: string | undefined;
        };
    }>;
    listForDoctor(doctorSub: string, opts?: {
        q?: string;
        limit?: number;
    }): Promise<Array<{
        id: string;
        appointmentId: string;
        patientName?: string;
        patientEmail?: string;
        diagnosis: string;
        medicinesSummary: string;
        followUpDate?: string;
        createdAt?: string;
    }>>;
}
