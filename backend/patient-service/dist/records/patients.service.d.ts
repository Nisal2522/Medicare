import { Model } from 'mongoose';
import { MedicalFileStorageService } from '../storage/medical-file.storage.service';
import { MedicalRecord, MedicalRecordType } from './medical-record.schema';
import { PatientPayment, PaymentStatus } from './patient-payment.schema';
import { PatientProfile } from './patient-profile.schema';
declare const UPLOAD_CATEGORIES: readonly ["prescription", "blood", "imaging", "general"];
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];
export type PatientUploadMeta = {
    title?: string;
    category?: string;
    doctorName?: string;
    specialty?: string;
};
export declare class PatientsService {
    private readonly recordModel;
    private readonly profileModel;
    private readonly paymentModel;
    private readonly medicalFileStorage;
    constructor(recordModel: Model<MedicalRecord>, profileModel: Model<PatientProfile>, paymentModel: Model<PatientPayment>, medicalFileStorage: MedicalFileStorageService);
    uploadPatientReport(patientId: string, file: Express.Multer.File, meta: PatientUploadMeta): Promise<{
        id: string;
        patientId: string;
        type: MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }>;
    deletePatientRecord(patientId: string, recordId: string): Promise<{
        message: string;
    }>;
    getRecordsForPatient(patientId: string): Promise<{
        id: string;
        patientId: string;
        type: MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }[]>;
    getPrescriptionsForPatient(patientId: string): Promise<{
        id: string;
        patientId: string;
        type: MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }[]>;
    getPaymentsForPatient(patientId: string): Promise<{
        id: string;
        patientId: string;
        amountCents: number;
        currency: string;
        description: string;
        status: PaymentStatus;
        reference: string;
        appointmentId: string | null;
        createdAt: Date | undefined;
    }[]>;
    getPatientProfile(patientId: string): Promise<{
        patientId: string;
        avatarUrl: string | null;
    }>;
    uploadPatientAvatar(patientId: string, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
    private seedDemoPayments;
    private seedDemoRecords;
    private mapRow;
    private mapPayment;
}
export {};
