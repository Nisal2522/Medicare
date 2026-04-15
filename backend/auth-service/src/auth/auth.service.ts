import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { firstValueFrom } from 'rxjs';
import { AdminService } from './admin/admin.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  private static readonly USER_REGISTERED_V1 = 'UserRegistered.v1';

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,
    @Inject('PATIENT_EVENTS_CLIENT')
    private readonly patientEventsClient: ClientProxy,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.authRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.authRepository.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      role: dto.role,
      phone: (dto.phone ?? '').trim(),
    });

    const userId = String(user._id);
    if (dto.role === Role.DOCTOR) {
      try {
        await this.adminService.provisionDoctorProfile(userId, dto.fullName);
      } catch (e) {
        await this.authRepository.deleteById(userId);
        throw e;
      }
    }

    void this.emitRegistrationEmail({
      userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
    void this.emitUserRegisteredEvent({
      userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone ?? '',
      },
    };
  }

  private async emitRegistrationEmail(payload: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
  }): Promise<void> {
    try {
      await firstValueFrom(
        this.notificationsClient.emit('user_registered', {
          userId: payload.userId,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
        }),
      );
    } catch {
      // Registration should still succeed if email delivery is unavailable.
    }
  }

  private async emitUserRegisteredEvent(payload: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
  }): Promise<void> {
    // Publish domain events instead of calling patient-service directly.
    // This keeps auth-service independent and allows eventual consistency.
    const event = {
      userId: payload.userId,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role as 'PATIENT' | 'DOCTOR' | 'ADMIN',
      occurredAt: new Date().toISOString(),
      traceId: randomUUID(),
    };
    try {
      await firstValueFrom(
        this.patientEventsClient.emit(AuthService.USER_REGISTERED_V1, event),
      );
    } catch {
      // User registration must remain available even if async profile sync is down.
    }
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone ?? '',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.newPassword != null && dto.newPassword.length > 0) {
      if (!dto.currentPassword?.length) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      const ok = await bcrypt.compare(dto.currentPassword, user.password);
      if (!ok) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    if (dto.email != null && dto.email.trim().toLowerCase() !== user.email) {
      const nextEmail = dto.email.trim().toLowerCase();
      const taken = await this.authRepository.findByEmail(nextEmail);
      if (taken && String(taken._id) !== userId) {
        throw new ConflictException('Email is already in use');
      }
      user.email = nextEmail;
    }

    if (dto.fullName != null) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.phone != null) {
      user.phone = dto.phone.trim();
    }

    await user.save();

    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone ?? '',
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone ?? '',
      },
    };
  }
}
