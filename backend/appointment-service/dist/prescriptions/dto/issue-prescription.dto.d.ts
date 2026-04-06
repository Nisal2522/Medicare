export declare class MedicineLineDto {
    name: string;
    dosage: string;
    frequency?: string;
    duration: string;
    instructions?: string;
}
export declare class IssuePrescriptionDto {
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
    medicines: MedicineLineDto[];
}
