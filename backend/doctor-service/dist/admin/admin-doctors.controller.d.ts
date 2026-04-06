import { DoctorsService } from '../doctors/doctors.service';
export declare class AdminDoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    list(): Promise<{
        id: string;
        name: string;
        specialty: string;
        isVerified: boolean;
        location: string;
        createdAt?: string;
    }[]>;
    verify(id: string): Promise<{
        message: string;
        id: string;
    }>;
}
