import type { JwtPayload } from '../auth/jwt.strategy';
import { IssuePrescriptionDto } from './dto/issue-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';
export declare class PrescriptionsController {
    private readonly prescriptions;
    constructor(prescriptions: PrescriptionsService);
    issue(req: {
        user: JwtPayload;
    }, dto: IssuePrescriptionDto): Promise<{
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
    listForDoctor(req: {
        user: JwtPayload;
    }, q?: string, limit?: string): Promise<{
        id: string;
        appointmentId: string;
        patientName?: string;
        patientEmail?: string;
        diagnosis: string;
        medicinesSummary: string;
        followUpDate?: string;
        createdAt?: string;
    }[]>;
    getDoctorPrescription(req: {
        user: JwtPayload;
    }, id: string): Promise<{
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
    listForPatient(req: {
        user: JwtPayload;
    }, q?: string, limit?: string): Promise<{
        id: string;
        appointmentId: string;
        doctorName?: string;
        diagnosis: string;
        medicinesSummary: string;
        followUpDate?: string;
        createdAt?: string;
    }[]>;
    getPatientPrescription(req: {
        user: JwtPayload;
    }, id: string): Promise<{
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
}
