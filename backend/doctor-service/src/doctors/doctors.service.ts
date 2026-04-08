import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from './doctor.schema';
import { normalizeDayFilter } from './day-normalize.util';
import { DoctorRepository } from './doctor.repository';
import { DoctorSearchQueryDto } from './dto/doctor-search-query.dto';
import { PatchAvailabilityDto } from './dto/patch-availability.dto';
import { PatchDoctorProfileDto } from './dto/patch-doctor-profile.dto';
import { COLOMBO_TZ, withColomboZone } from './timezone.util';
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
  /** All slot times are interpreted in this IANA timezone */
  timeZone: typeof COLOMBO_TZ;
  hospital?: string;
  location?: string;
};

export type DoctorDetailResult = DoctorSearchResult & { isVerified: boolean };

@Injectable()
export class DoctorsService implements OnModuleInit {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    private readonly s3Service: S3Service,
  ) {}

  async onModuleInit(): Promise<void> {
    const legacy = await this.doctorModel.exists({ availability: { $exists: false } });
    if (legacy) {
      await this.doctorModel.deleteMany({});
    }

    await this.doctorModel.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: true } },
    );
    await this.doctorModel.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } },
    );

    const defaultProfilePicture =
      'https://images.unsplash.com/photo-1527613426441-4da17449b3d0?auto=format&fit=crop&w=400&q=80';
    await this.doctorModel.updateMany(
      {
        $or: [
          { profilePicture: { $exists: false } },
          { profilePicture: '' },
          { profilePicture: null },
        ],
      },
      { $set: { profilePicture: defaultProfilePicture } },
    );

    const count = await this.doctorModel.countDocuments();
    if (count > 0) return;

    await this.doctorModel.insertMany([
      {
        name: 'Dr. Saman Perera',
        specialty: 'General Medicine',
        isVerified: true,
        experience: 12,
        profilePicture:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
        location: 'Colombo',
        availability: [
          {
            day: 'Monday',
            startTime: '09:00 AM',
            endTime: '11:00 AM',
            maxPatients: 8,
            isAvailable: true,
          },
          {
            day: 'Wednesday',
            startTime: '02:00 PM',
            endTime: '05:00 PM',
            maxPatients: 6,
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Dr. Nimali Fernando',
        specialty: 'Cardiology',
        isVerified: true,
        experience: 18,
        profilePicture:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
        location: 'Kandy',
        availability: [
          {
            day: 'Tuesday',
            startTime: '10:00 AM',
            endTime: '12:30 PM',
            maxPatients: 5,
            isAvailable: true,
          },
          {
            day: 'Thursday',
            startTime: '11:00 AM',
            endTime: '01:00 PM',
            maxPatients: 4,
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Dr. Ruwani Silva',
        specialty: 'Dental',
        isVerified: true,
        experience: 8,
        profilePicture:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
        location: 'Colombo',
        availability: [
          {
            day: 'Friday',
            startTime: '09:30 AM',
            endTime: '12:00 PM',
            maxPatients: 10,
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Dr. Ashan Jayawardena',
        specialty: 'Pediatrics',
        isVerified: true,
        experience: 10,
        profilePicture:
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
        location: 'Galle',
        availability: [],
      },
      {
        name: 'Dr. Malithi Ranasinghe',
        specialty: 'Dermatology',
        isVerified: true,
        experience: 14,
        profilePicture:
          'https://images.unsplash.com/photo-1527613426441-4da17449b3d0?auto=format&fit=crop&w=400&q=80',
        location: 'Colombo',
        availability: [
          {
            day: 'Monday',
            startTime: '03:00 PM',
            endTime: '06:00 PM',
            maxPatients: 7,
            isAvailable: true,
          },
          {
            day: 'Saturday',
            startTime: '09:00 AM',
            endTime: '11:00 AM',
            maxPatients: 5,
            isAvailable: true,
          },
        ],
      },
    ]);
  }

  async search(query: DoctorSearchQueryDto): Promise<DoctorSearchResult[]> {
    if (query.day !== undefined && query.day.trim() !== '') {
      const ok = normalizeDayFilter(query.day);
      if (!ok) {
        throw new BadRequestException(
          'Invalid day. Use a weekday such as Monday, Mon, or Wednesday.',
        );
      }
    }

    const dayCanonical = query.day?.trim() ? normalizeDayFilter(query.day) : undefined;

    const rows = await this.doctorRepository.search({
      name: query.name,
      specialty: query.specialty,
      availability: query.availability,
      day: dayCanonical ?? undefined,
      location: query.location,
    });

    const mapped = await Promise.all(
      rows.map(async (doc) => ({
        id: String((doc as unknown as { _id: Types.ObjectId })._id),
        name: doc.name,
        specialty: doc.specialty,
        experience: doc.experience,
        qualification: doc.qualification ?? '',
        consultationFee: doc.consultationFee ?? 0,
        profilePicture: await this.resolvePublicReadUrl(doc.profilePicture ?? ''),
        availability: (doc.availability ?? []).map((s) => withColomboZone(s)),
        timeZone: COLOMBO_TZ as typeof COLOMBO_TZ,
        ...(doc.hospital ? { hospital: doc.hospital } : {}),
        ...(doc.location ? { location: doc.location } : {}),
      })),
    );
    return mapped;
  }

  async updateAvailability(
    jwtSub: string,
    role: string,
    dto: PatchAvailabilityDto,
  ): Promise<DoctorDetailResult> {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can update availability');
    }
    if (!Types.ObjectId.isValid(jwtSub)) {
      throw new ForbiddenException('Invalid doctor context');
    }
    const existing = await this.doctorRepository.findById(jwtSub);
    if (!existing) {
      throw new NotFoundException(
        'Doctor profile not found. Your account id must match a doctor document _id.',
      );
    }

    const availability: {
      day: string;
      startTime: string;
      endTime: string;
      maxPatients: number;
      isAvailable: boolean;
    }[] = [];

    for (const d of dto.days) {
      const canonical = normalizeDayFilter(d.day);
      if (!canonical) {
        throw new BadRequestException(`Invalid weekday: ${d.day}`);
      }
      if (d.closed) {
        continue;
      }
      for (const s of d.slots) {
        const start = s.startTime.trim();
        const end = s.endTime.trim();
        if (!start || !end) {
          throw new BadRequestException('Each slot needs startTime and endTime');
        }
        availability.push({
          day: canonical,
          startTime: start,
          endTime: end,
          maxPatients: s.maxPatients ?? 5,
          isAvailable: true,
        });
      }
    }

    await this.doctorRepository.updateAvailability(jwtSub, availability);
    return this.findById(jwtSub);
  }

  async findById(id: string): Promise<DoctorDetailResult> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Doctor not found');
    }
    const doc = await this.doctorRepository.findById(id);
    if (!doc) {
      throw new NotFoundException('Doctor not found');
    }
    return {
      id,
      name: doc.name,
      specialty: doc.specialty,
      experience: doc.experience,
      qualification: doc.qualification ?? '',
      consultationFee: doc.consultationFee ?? 0,
      profilePicture: await this.resolvePublicReadUrl(doc.profilePicture ?? ''),
      availability: (doc.availability ?? []).map((s) => withColomboZone(s)),
      timeZone: COLOMBO_TZ,
      isVerified: doc.isVerified === true,
      ...(doc.hospital ? { hospital: doc.hospital } : {}),
      ...(doc.location ? { location: doc.location } : {}),
    };
  }

  async setActiveByInternal(id: string, active: boolean): Promise<{ id: string; isActive: boolean }> {
    const matched = await this.doctorRepository.setActive(id, active);
    if (!matched) {
      throw new NotFoundException('Doctor profile not found');
    }
    return { id, isActive: active };
  }

  async updateProfile(
    jwtSub: string,
    role: string,
    dto: PatchDoctorProfileDto,
  ): Promise<DoctorDetailResult> {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can update profile');
    }
    if (!Types.ObjectId.isValid(jwtSub)) {
      throw new ForbiddenException('Invalid doctor context');
    }
    const existing = await this.doctorRepository.findById(jwtSub);
    if (!existing) {
      throw new NotFoundException(
        'Doctor profile not found. Your account id must match a doctor document _id.',
      );
    }

    const patch: Partial<{
      specialty: string;
      qualification: string;
      experience: number;
      consultationFee: number;
      hospital: string;
      location: string;
      profilePicture: string;
    }> = {};

    if (dto.specialty !== undefined) patch.specialty = dto.specialty.trim();
    if (dto.qualification !== undefined) patch.qualification = dto.qualification.trim();
    if (dto.experience !== undefined) patch.experience = dto.experience;
    if (dto.consultationFee !== undefined) patch.consultationFee = dto.consultationFee;
    if (dto.hospital !== undefined) {
      const hospital = dto.hospital.trim();
      patch.hospital = hospital;
      patch.location = hospital;
    }
    if (dto.profilePicture !== undefined) patch.profilePicture = dto.profilePicture.trim();

    const updated = await this.doctorRepository.updateProfile(jwtSub, patch);
    if (!updated) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.findById(jwtSub);
  }

  async uploadProfilePhoto(
    jwtSub: string,
    role: string,
    file: Express.Multer.File,
  ): Promise<{ profilePicture: string; doctor: DoctorDetailResult }> {
    if (role !== 'DOCTOR') {
      throw new ForbiddenException('Only doctors can upload profile photos');
    }
    if (!Types.ObjectId.isValid(jwtSub)) {
      throw new ForbiddenException('Invalid doctor context');
    }
    const existing = await this.doctorRepository.findById(jwtSub);
    if (!existing) {
      throw new NotFoundException(
        'Doctor profile not found. Your account id must match a doctor document _id.',
      );
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const hasBucket = (process.env.AWS_S3_BUCKET_NAME ?? '').trim().length > 0;
    const profilePicture = hasBucket
      ? await this.uploadDoctorAvatarToS3(file)
      : await this.uploadDoctorAvatarToLocal(file);

    await this.doctorRepository.updateProfile(jwtSub, { profilePicture });
    const doctor = await this.findById(jwtSub);
    const readable = await this.resolvePublicReadUrl(profilePicture);
    return { profilePicture: readable, doctor };
  }

  private async uploadDoctorAvatarToS3(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file, 'doctor-avatars');
  }

  private async resolvePublicReadUrl(fileUrl: string): Promise<string> {
    const url = fileUrl.trim();
    if (!url) {
      return '';
    }
    const hasBucket = (process.env.AWS_S3_BUCKET_NAME ?? '').trim().length > 0;
    if (!hasBucket) {
      return url;
    }
    try {
      return await this.s3Service.createSignedReadUrl(url);
    } catch {
      return url;
    }
  }

  private async uploadDoctorAvatarToLocal(
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = extname(file.originalname || '').slice(0, 16) || '.jpg';
    const key = `${randomUUID()}${ext}`;
    const absDir = join(process.cwd(), 'uploads', 'doctor-avatars');
    await mkdir(absDir, { recursive: true });
    await writeFile(join(absDir, key), file.buffer);

    const port = process.env.PORT ?? '3000';
    const base = (
      process.env.DOCTOR_API_PUBLIC_URL ?? `http://localhost:${port}`
    ).replace(/\/$/, '');
    return `${base}/uploads/doctor-avatars/${key}`;
  }

  async listAllForAdmin(): Promise<
    {
      id: string;
      name: string;
      specialty: string;
      isVerified: boolean;
      location: string;
      createdAt?: string;
    }[]
  > {
    const rows = await this.doctorModel
      .find()
      .select('_id name specialty isVerified location createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => ({
      id: String((r as { _id: Types.ObjectId })._id),
      name: (r as { name: string }).name,
      specialty: (r as { specialty: string }).specialty,
      isVerified: (r as { isVerified?: boolean }).isVerified === true,
      location: (r as { location?: string }).location ?? '',
      createdAt: (r as { createdAt?: Date }).createdAt
        ? new Date((r as { createdAt?: Date }).createdAt!).toISOString()
        : undefined,
    }));
  }

  async verifyDoctorByAdmin(id: string): Promise<{ message: string; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Doctor not found');
    }
    const matched = await this.doctorRepository.setVerified(id, true);
    if (!matched) {
      throw new NotFoundException('Doctor not found');
    }
    return { message: 'Doctor verified', id };
  }

  async provisionFromAuth(
    userId: string,
    fullName: string,
  ): Promise<{ message: string; id: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const existing = await this.doctorRepository.findById(userId);
    if (existing) {
      return { message: 'Doctor profile already exists', id: userId };
    }
    await this.doctorModel.create({
      _id: new Types.ObjectId(userId),
      name: fullName.trim(),
      specialty: 'General Medicine',
      experience: 0,
      qualification: '',
      consultationFee: 0,
      profilePicture: '',
      hospital: '',
      location: '',
      availability: [],
      isVerified: false,
      isActive: true,
    });
    return { message: 'Doctor profile created', id: userId };
  }
}
