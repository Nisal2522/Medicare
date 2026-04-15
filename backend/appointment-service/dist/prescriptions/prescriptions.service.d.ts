import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentDocument } from '../appointments/appointment.schema';
import type { JwtPayload } from '../auth/jwt.strategy';
import { IssuePrescriptionDto } from './dto/issue-prescription.dto';
import { PrescriptionDocument } from './prescription.schema';
export declare class PrescriptionsService {
    private readonly prescriptionModel;
    private readonly appointmentModel;
    private readonly appointments;
    private readonly notifications;
    constructor(prescriptionModel: Model<PrescriptionDocument>, appointmentModel: Model<AppointmentDocument>, appointments: AppointmentsService, notifications: ClientProxy);
    issue(user: JwtPayload, dto: IssuePrescriptionDto): Promise<{
        message: string;
        prescription: {
            id: string;
            patientId: string | undefined;
            patientEmail: string;
            doctorId: string;
            doctorName: string | undefined;
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
    listForPatient(patientSub: string, opts?: {
        q?: string;
        limit?: number;
    }): Promise<Array<{
        id: string;
        appointmentId: string;
        doctorName?: string;
        diagnosis: string;
        medicinesSummary: string;
        followUpDate?: string;
        createdAt?: string;
    }>>;
    getForPatient(patientSub: string, prescriptionId: string): Promise<{
        id: string;
        appointmentId: string;
        doctorName?: string;
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
    }>;
    private resolveDoctorName;
    private resolveDoctorNamesByAppointmentIds;
    getForDoctor(doctorSub: string, prescriptionId: string): Promise<{
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
    }>;
}
