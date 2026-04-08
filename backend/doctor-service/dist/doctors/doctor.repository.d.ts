import { Model } from 'mongoose';
import { Doctor } from './doctor.schema';
export interface DoctorSearchFilters {
    name?: string;
    specialty?: string;
    availability?: string;
    day?: string;
    location?: string;
}
export declare class DoctorRepository {
    private readonly doctorModel;
    constructor(doctorModel: Model<Doctor>);
    findById(id: string): Promise<Doctor | null>;
    search(filters: DoctorSearchFilters): Promise<Doctor[]>;
    updateAvailability(id: string, availability: {
        day: string;
        startTime: string;
        endTime: string;
        maxPatients: number;
        isAvailable: boolean;
    }[]): Promise<void>;
    updateProfile(id: string, patch: Partial<{
        specialty: string;
        qualification: string;
        experience: number;
        consultationFee: number;
        hospital: string;
        location: string;
        profilePicture: string;
    }>): Promise<boolean>;
    setVerified(id: string, verified: boolean): Promise<boolean>;
    setActive(id: string, active: boolean): Promise<boolean>;
}
