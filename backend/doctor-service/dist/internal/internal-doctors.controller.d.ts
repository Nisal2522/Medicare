import { DoctorsService } from '../doctors/doctors.service';
import { ProvisionDoctorDto } from './dto/provision-doctor.dto';
import { SetDoctorActiveDto } from './dto/set-doctor-active.dto';
export declare class InternalDoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    provision(dto: ProvisionDoctorDto): Promise<{
        message: string;
        id: string;
    }>;
    setActive(dto: SetDoctorActiveDto): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
