import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './enums/role.enum';
import { AuthRepository } from './auth.repository';
import { LandingPartner } from './schemas/landing-partner.schema';

const DEFAULT_PARTNER_NAMES = [
  'CareLink',
  'MediCore',
  'PulseHealth',
  'VitaLabs',
  'NorthCare',
] as const;

@Injectable()
export class PublicLandingService implements OnModuleInit {
  constructor(
    private readonly authRepository: AuthRepository,
    @InjectModel(LandingPartner.name)
    private readonly partnerModel: Model<LandingPartner>,
  ) {}

  async onModuleInit(): Promise<void> {
    const n = await this.partnerModel.estimatedDocumentCount();
    if (n > 0) return;
    await this.partnerModel.insertMany(
      DEFAULT_PARTNER_NAMES.map((name, sortOrder) => ({ name, sortOrder })),
    );
  }

  async getLandingSnapshot(): Promise<{
    doctorCount: number;
    patientCount: number;
    partners: string[];
  }> {
    const [doctorCount, patientCount, partnerDocs] = await Promise.all([
      this.authRepository.countActiveByRole(Role.DOCTOR),
      this.authRepository.countActiveByRole(Role.PATIENT),
      this.partnerModel.find().sort({ sortOrder: 1 }).lean().exec(),
    ]);
    return {
      doctorCount,
      patientCount,
      partners: partnerDocs.map((p) => p.name),
    };
  }
}
