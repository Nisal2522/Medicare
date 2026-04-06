import type { JwtPayload } from '../auth/jwt.strategy';
import { DoctorsService } from './doctors.service';
import { DoctorSearchQueryDto } from './dto/doctor-search-query.dto';
import { PatchAvailabilityDto } from './dto/patch-availability.dto';
import { PatchDoctorProfileDto } from './dto/patch-doctor-profile.dto';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    private static readonly avatarUploadLimits;
    search(query: DoctorSearchQueryDto): Promise<import("./doctors.service").DoctorSearchResult[]>;
    patchAvailability(req: {
        user: JwtPayload;
    }, dto: PatchAvailabilityDto): Promise<import("./doctors.service").DoctorDetailResult>;
    patchProfile(req: {
        user: JwtPayload;
    }, dto: PatchDoctorProfileDto): Promise<import("./doctors.service").DoctorDetailResult>;
    findMe(req: {
        user: JwtPayload;
    }): Promise<import("./doctors.service").DoctorDetailResult>;
    uploadProfilePhoto(req: {
        user: JwtPayload;
    }, file: Express.Multer.File | undefined): Promise<{
        profilePicture: string;
        doctor: import("./doctors.service").DoctorDetailResult;
    }>;
    findOne(id: string): Promise<import("./doctors.service").DoctorDetailResult>;
}
