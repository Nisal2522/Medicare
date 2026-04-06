import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { AuthRepository } from './auth.repository';
import { LandingPartner } from './schemas/landing-partner.schema';
export declare class PublicLandingService implements OnModuleInit {
    private readonly authRepository;
    private readonly partnerModel;
    constructor(authRepository: AuthRepository, partnerModel: Model<LandingPartner>);
    onModuleInit(): Promise<void>;
    getLandingSnapshot(): Promise<{
        doctorCount: number;
        patientCount: number;
        partners: string[];
    }>;
}
