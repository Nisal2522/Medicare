import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Doctor } from './doctor.schema';
import { DoctorRepository } from './doctor.repository';
import { DoctorSearchQueryDto } from './dto/doctor-search-query.dto';
import { PatchAvailabilityDto } from './dto/patch-availability.dto';
import { PatchDoctorProfileDto } from './dto/patch-doctor-profile.dto';
import { COLOMBO_TZ } from './timezone.util';
import { S3Service } from '../storage/s3.service';
export type AvailabilitySlotDto = {
    day: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
    isAvailable: boolean;
    timeZone: typeof COLOMBO_TZ;
};
export type DoctorSearchResult = {
    id: string;
    name: string;
    specialty: string;
    experience: number;
    qualification?: string;
    consultationFee?: number;
    profilePicture: string;
    availability: AvailabilitySlotDto[];
    timeZone: typeof COLOMBO_TZ;
    hospital?: string;
    location?: string;
};
export type DoctorDetailResult = DoctorSearchResult & {
    isVerified: boolean;
};
export declare class DoctorsService implements OnModuleInit {
    private readonly doctorRepository;
    private readonly doctorModel;
    private readonly s3Service;
    constructor(doctorRepository: DoctorRepository, doctorModel: Model<Doctor>, s3Service: S3Service);
    onModuleInit(): Promise<void>;
    search(query: DoctorSearchQueryDto): Promise<DoctorSearchResult[]>;
    updateAvailability(jwtSub: string, role: string, dto: PatchAvailabilityDto): Promise<DoctorDetailResult>;
    findById(id: string): Promise<DoctorDetailResult>;
    setActiveByInternal(id: string, active: boolean): Promise<{
        id: string;
        isActive: boolean;
    }>;
    updateProfile(jwtSub: string, role: string, dto: PatchDoctorProfileDto): Promise<DoctorDetailResult>;
    uploadProfilePhoto(jwtSub: string, role: string, file: Express.Multer.File): Promise<{
        profilePicture: string;
        doctor: DoctorDetailResult;
    }>;
    private uploadDoctorAvatarToS3;
    private resolvePublicReadUrl;
    private uploadDoctorAvatarToLocal;
    listAllForAdmin(): Promise<{
        id: string;
        name: string;
        specialty: string;
        isVerified: boolean;
        location: string;
        createdAt?: string;
    }[]>;
    verifyDoctorByAdmin(id: string): Promise<{
        message: string;
        id: string;
    }>;
    provisionFromAuth(userId: string, fullName: string): Promise<{
        message: string;
        id: string;
    }>;
}
