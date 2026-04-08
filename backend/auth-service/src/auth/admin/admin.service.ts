import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Role } from '../enums/role.enum';
import { User, UserDocument } from '../schemas/user.schema';

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
};

type PlatformSummary = {
  totalAppointments: number;
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
};

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly http: HttpService,
  ) {}

  async listUsers(): Promise<AdminUserRow[]> {
    const rows = await this.userModel
      .find({ role: { $in: [Role.PATIENT, Role.DOCTOR] } })
      .select('_id fullName email role isActive createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return rows.map((r) => {
      const row = r as {
        _id: unknown;
        fullName: string;
        email: string;
        role: string;
        isActive?: boolean;
        createdAt?: Date;
      };
      return {
        id: String(row._id),
        fullName: row.fullName,
        email: row.email,
        role: row.role,
        isActive: row.isActive !== false,
        createdAt: row.createdAt
          ? new Date(row.createdAt).toISOString()
          : undefined,
      };
    });
  }

  async deactivateUser(actorSub: string, targetId: string): Promise<{ message: string }> {
    if (actorSub === targetId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    const target = await this.userModel.findById(targetId).exec();
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot change admin accounts from this endpoint');
    }
    target.isActive = false;
    await target.save();
    await this.syncDoctorActivationIfNeeded(targetId, target.role, false);
    return { message: 'Account deactivated' };
  }

  async deleteUser(actorSub: string, targetId: string): Promise<{ message: string }> {
    if (actorSub === targetId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const target = await this.userModel.findById(targetId).exec();
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot delete admin accounts from this endpoint');
    }

    await this.syncDoctorActivationIfNeeded(targetId, target.role, false);
    await target.deleteOne();
    return { message: 'Account deleted' };
  }

  async activateUser(actorSub: string, targetId: string): Promise<{ message: string }> {
    if (actorSub === targetId) {
      throw new ForbiddenException('You cannot activate your own account from this endpoint');
    }
    const target = await this.userModel.findById(targetId).exec();
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot change admin accounts from this endpoint');
    }
    target.isActive = true;
    await target.save();
    await this.syncDoctorActivationIfNeeded(targetId, target.role, true);
    return { message: 'Account activated' };
  }

  async getStats(authorization: string | undefined): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
    newSignUpsToday: number;
    monthlyRevenue: { month: string; revenue: number }[];
  }> {
    const [totalPatients, totalDoctors, newSignUpsToday] = await Promise.all([
      this.userModel.countDocuments({ role: Role.PATIENT }),
      this.userModel.countDocuments({ role: Role.DOCTOR }),
      this.countSignupsSinceUtcMidnight(),
    ]);

    let platform: PlatformSummary = {
      totalAppointments: 0,
      totalRevenue: 0,
      monthlyRevenue: [],
    };
    const base =
      process.env.APPOINTMENT_SERVICE_URL ?? 'http://localhost:3003';
    const url = `${base.replace(/\/$/, '')}/appointments/admin/platform-summary`;
    try {
      const { data } = await firstValueFrom(
        this.http.get<PlatformSummary>(url, {
          headers: { Authorization: authorization ?? '' },
          timeout: 12_000,
        }),
      );
      platform = data;
    } catch {
      /* appointment service optional for local dev */
    }

    return {
      totalPatients,
      totalDoctors,
      totalAppointments: platform.totalAppointments,
      totalRevenue: platform.totalRevenue,
      newSignUpsToday,
      monthlyRevenue: platform.monthlyRevenue ?? [],
    };
  }

  private async countSignupsSinceUtcMidnight(): Promise<number> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return this.userModel.countDocuments({
      createdAt: { $gte: start },
      role: { $in: [Role.PATIENT, Role.DOCTOR] },
    });
  }

  async verifyDoctor(
    authorization: string | undefined,
    doctorId: string,
  ): Promise<unknown> {
    const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
    const url = `${base.replace(/\/$/, '')}/admin/doctors/${doctorId}/verify`;
    try {
      const { data } = await firstValueFrom(
        this.http.patch<unknown>(
          url,
          {},
          {
            headers: { Authorization: authorization ?? '' },
            timeout: 12_000,
          },
        ),
      );
      return data;
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown } };
      if (err.response?.status === 404) {
        throw new NotFoundException('Doctor profile not found');
      }
      if (err.response?.status === 403) {
        throw new ForbiddenException('Not allowed to verify doctors');
      }
      throw new ServiceUnavailableException(
        'Could not reach doctor service. Is it running?',
      );
    }
  }

  async provisionDoctorProfile(userId: string, fullName: string): Promise<void> {
    const key = process.env.INTERNAL_SERVICE_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Doctor onboarding is not configured (set INTERNAL_SERVICE_KEY and doctor service URL).',
      );
    }
    const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
    const url = `${base.replace(/\/$/, '')}/internal/doctors/provision`;
    try {
      await firstValueFrom(
        this.http.post(
          url,
          { userId, fullName },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Key': key,
            },
            timeout: 12_000,
          },
        ),
      );
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? 'Doctor profile could not be created';
      throw new BadRequestException(
        typeof msg === 'string' ? msg : 'Doctor profile could not be created',
      );
    }
  }

  private async syncDoctorActivationIfNeeded(
    userId: string,
    role: Role,
    isActive: boolean,
  ): Promise<void> {
    if (role !== Role.DOCTOR) {
      return;
    }
    const key = process.env.INTERNAL_SERVICE_KEY?.trim();
    if (!key) {
      return;
    }
    const base = process.env.DOCTOR_SERVICE_URL ?? 'http://localhost:3000';
    const url = `${base.replace(/\/$/, '')}/internal/doctors/set-active`;
    try {
      await firstValueFrom(
        this.http.post(
          url,
          { userId, isActive },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Service-Key': key,
            },
            timeout: 12_000,
          },
        ),
      );
    } catch {
      // Do not fail admin action if doctor-service is temporarily unavailable.
    }
  }
}
