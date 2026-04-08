"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const mongoose_3 = require("mongoose");
const doctor_schema_1 = require("./doctor.schema");
const day_normalize_util_1 = require("./day-normalize.util");
const doctor_repository_1 = require("./doctor.repository");
const timezone_util_1 = require("./timezone.util");
const s3_service_1 = require("../storage/s3.service");
let DoctorsService = class DoctorsService {
    doctorRepository;
    doctorModel;
    s3Service;
    constructor(doctorRepository, doctorModel, s3Service) {
        this.doctorRepository = doctorRepository;
        this.doctorModel = doctorModel;
        this.s3Service = s3Service;
    }
    async onModuleInit() {
        const legacy = await this.doctorModel.exists({ availability: { $exists: false } });
        if (legacy) {
            await this.doctorModel.deleteMany({});
        }
        await this.doctorModel.updateMany({ isVerified: { $exists: false } }, { $set: { isVerified: true } });
        await this.doctorModel.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });
        const defaultProfilePicture = 'https://images.unsplash.com/photo-1527613426441-4da17449b3d0?auto=format&fit=crop&w=400&q=80';
        await this.doctorModel.updateMany({
            $or: [
                { profilePicture: { $exists: false } },
                { profilePicture: '' },
                { profilePicture: null },
            ],
        }, { $set: { profilePicture: defaultProfilePicture } });
        const count = await this.doctorModel.countDocuments();
        if (count > 0)
            return;
        await this.doctorModel.insertMany([
            {
                name: 'Dr. Saman Perera',
                specialty: 'General Medicine',
                isVerified: true,
                experience: 12,
                profilePicture: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
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
                profilePicture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
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
                profilePicture: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
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
                profilePicture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
                location: 'Galle',
                availability: [],
            },
            {
                name: 'Dr. Malithi Ranasinghe',
                specialty: 'Dermatology',
                isVerified: true,
                experience: 14,
                profilePicture: 'https://images.unsplash.com/photo-1527613426441-4da17449b3d0?auto=format&fit=crop&w=400&q=80',
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
    async search(query) {
        if (query.day !== undefined && query.day.trim() !== '') {
            const ok = (0, day_normalize_util_1.normalizeDayFilter)(query.day);
            if (!ok) {
                throw new common_1.BadRequestException('Invalid day. Use a weekday such as Monday, Mon, or Wednesday.');
            }
        }
        const dayCanonical = query.day?.trim() ? (0, day_normalize_util_1.normalizeDayFilter)(query.day) : undefined;
        const rows = await this.doctorRepository.search({
            name: query.name,
            specialty: query.specialty,
            availability: query.availability,
            day: dayCanonical ?? undefined,
            location: query.location,
        });
        const mapped = await Promise.all(rows.map(async (doc) => ({
            id: String(doc._id),
            name: doc.name,
            specialty: doc.specialty,
            experience: doc.experience,
            qualification: doc.qualification ?? '',
            consultationFee: doc.consultationFee ?? 0,
            profilePicture: await this.resolvePublicReadUrl(doc.profilePicture ?? ''),
            availability: (doc.availability ?? []).map((s) => (0, timezone_util_1.withColomboZone)(s)),
            timeZone: timezone_util_1.COLOMBO_TZ,
            ...(doc.hospital ? { hospital: doc.hospital } : {}),
            ...(doc.location ? { location: doc.location } : {}),
        })));
        return mapped;
    }
    async updateAvailability(jwtSub, role, dto) {
        if (role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Only doctors can update availability');
        }
        if (!mongoose_1.Types.ObjectId.isValid(jwtSub)) {
            throw new common_1.ForbiddenException('Invalid doctor context');
        }
        const existing = await this.doctorRepository.findById(jwtSub);
        if (!existing) {
            throw new common_1.NotFoundException('Doctor profile not found. Your account id must match a doctor document _id.');
        }
        const availability = [];
        for (const d of dto.days) {
            const canonical = (0, day_normalize_util_1.normalizeDayFilter)(d.day);
            if (!canonical) {
                throw new common_1.BadRequestException(`Invalid weekday: ${d.day}`);
            }
            if (d.closed) {
                continue;
            }
            for (const s of d.slots) {
                const start = s.startTime.trim();
                const end = s.endTime.trim();
                if (!start || !end) {
                    throw new common_1.BadRequestException('Each slot needs startTime and endTime');
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
    async findById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        const doc = await this.doctorRepository.findById(id);
        if (!doc) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        return {
            id,
            name: doc.name,
            specialty: doc.specialty,
            experience: doc.experience,
            qualification: doc.qualification ?? '',
            consultationFee: doc.consultationFee ?? 0,
            profilePicture: await this.resolvePublicReadUrl(doc.profilePicture ?? ''),
            availability: (doc.availability ?? []).map((s) => (0, timezone_util_1.withColomboZone)(s)),
            timeZone: timezone_util_1.COLOMBO_TZ,
            isVerified: doc.isVerified === true,
            ...(doc.hospital ? { hospital: doc.hospital } : {}),
            ...(doc.location ? { location: doc.location } : {}),
        };
    }
    async setActiveByInternal(id, active) {
        const matched = await this.doctorRepository.setActive(id, active);
        if (!matched) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        return { id, isActive: active };
    }
    async updateProfile(jwtSub, role, dto) {
        if (role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Only doctors can update profile');
        }
        if (!mongoose_1.Types.ObjectId.isValid(jwtSub)) {
            throw new common_1.ForbiddenException('Invalid doctor context');
        }
        const existing = await this.doctorRepository.findById(jwtSub);
        if (!existing) {
            throw new common_1.NotFoundException('Doctor profile not found. Your account id must match a doctor document _id.');
        }
        const patch = {};
        if (dto.specialty !== undefined)
            patch.specialty = dto.specialty.trim();
        if (dto.qualification !== undefined)
            patch.qualification = dto.qualification.trim();
        if (dto.experience !== undefined)
            patch.experience = dto.experience;
        if (dto.consultationFee !== undefined)
            patch.consultationFee = dto.consultationFee;
        if (dto.hospital !== undefined) {
            const hospital = dto.hospital.trim();
            patch.hospital = hospital;
            patch.location = hospital;
        }
        if (dto.profilePicture !== undefined)
            patch.profilePicture = dto.profilePicture.trim();
        const updated = await this.doctorRepository.updateProfile(jwtSub, patch);
        if (!updated) {
            throw new common_1.NotFoundException('Doctor profile not found');
        }
        return this.findById(jwtSub);
    }
    async uploadProfilePhoto(jwtSub, role, file) {
        if (role !== 'DOCTOR') {
            throw new common_1.ForbiddenException('Only doctors can upload profile photos');
        }
        if (!mongoose_1.Types.ObjectId.isValid(jwtSub)) {
            throw new common_1.ForbiddenException('Invalid doctor context');
        }
        const existing = await this.doctorRepository.findById(jwtSub);
        if (!existing) {
            throw new common_1.NotFoundException('Doctor profile not found. Your account id must match a doctor document _id.');
        }
        const mime = (file.mimetype ?? '').toLowerCase();
        if (!mime.startsWith('image/')) {
            throw new common_1.BadRequestException('Only image files are allowed');
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
    async uploadDoctorAvatarToS3(file) {
        return this.s3Service.uploadFile(file, 'doctor-avatars');
    }
    async resolvePublicReadUrl(fileUrl) {
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
        }
        catch {
            return url;
        }
    }
    async uploadDoctorAvatarToLocal(file) {
        const ext = (0, node_path_1.extname)(file.originalname || '').slice(0, 16) || '.jpg';
        const key = `${(0, node_crypto_1.randomUUID)()}${ext}`;
        const absDir = (0, node_path_1.join)(process.cwd(), 'uploads', 'doctor-avatars');
        await (0, promises_1.mkdir)(absDir, { recursive: true });
        await (0, promises_1.writeFile)((0, node_path_1.join)(absDir, key), file.buffer);
        const port = process.env.PORT ?? '3000';
        const base = (process.env.DOCTOR_API_PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, '');
        return `${base}/uploads/doctor-avatars/${key}`;
    }
    async listAllForAdmin() {
        const rows = await this.doctorModel
            .find()
            .select('_id name specialty isVerified location createdAt')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return rows.map((r) => ({
            id: String(r._id),
            name: r.name,
            specialty: r.specialty,
            isVerified: r.isVerified === true,
            location: r.location ?? '',
            createdAt: r.createdAt
                ? new Date(r.createdAt).toISOString()
                : undefined,
        }));
    }
    async verifyDoctorByAdmin(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        const matched = await this.doctorRepository.setVerified(id, true);
        if (!matched) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        return { message: 'Doctor verified', id };
    }
    async provisionFromAuth(userId, fullName) {
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new common_1.BadRequestException('Invalid user id');
        }
        const existing = await this.doctorRepository.findById(userId);
        if (existing) {
            return { message: 'Doctor profile already exists', id: userId };
        }
        await this.doctorModel.create({
            _id: new mongoose_1.Types.ObjectId(userId),
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
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_2.InjectModel)(doctor_schema_1.Doctor.name)),
    __metadata("design:paramtypes", [doctor_repository_1.DoctorRepository,
        mongoose_3.Model,
        s3_service_1.S3Service])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map