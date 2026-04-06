import { UploadReportBodyDto } from './dto/upload-report-body.dto';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PatientsService } from './patients.service';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    uploadReport(req: {
        user: JwtPayload;
    }, file: Express.Multer.File | undefined, body: UploadReportBodyDto): Promise<{
        id: string;
        patientId: string;
        type: import("./medical-record.schema").MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }>;
    uploadAvatar(req: {
        user: JwtPayload;
    }, file: Express.Multer.File | undefined): Promise<{
        avatarUrl: string;
    }>;
    getProfile(req: {
        user: JwtPayload;
    }, patientId: string): Promise<{
        patientId: string;
        avatarUrl: string | null;
    }>;
    getRecords(req: {
        user: JwtPayload;
    }, patientId: string): Promise<{
        id: string;
        patientId: string;
        type: import("./medical-record.schema").MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }[]>;
    deleteRecord(req: {
        user: JwtPayload;
    }, patientId: string, recordId: string): Promise<{
        message: string;
    }>;
    getPrescriptions(req: {
        user: JwtPayload;
    }, patientId: string): Promise<{
        id: string;
        patientId: string;
        type: import("./medical-record.schema").MedicalRecordType;
        title: string;
        doctorName: string;
        specialty: string;
        reportCategory: string;
        fileName: string;
        fileUrl: string;
        createdAt: Date | undefined;
    }[]>;
    getPayments(req: {
        user: JwtPayload;
    }, patientId: string): Promise<{
        id: string;
        patientId: string;
        amountCents: number;
        currency: string;
        description: string;
        status: import("./patient-payment.schema").PaymentStatus;
        reference: string;
        appointmentId: string | null;
        createdAt: Date | undefined;
    }[]>;
}
