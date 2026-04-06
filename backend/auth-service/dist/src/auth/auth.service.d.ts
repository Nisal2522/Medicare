import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin/admin.service';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from './enums/role.enum';
export declare class AuthService {
    private readonly authRepository;
    private readonly jwtService;
    private readonly adminService;
    constructor(authRepository: AuthRepository, jwtService: JwtService, adminService: AdminService);
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string;
            email: string;
            role: Role;
            phone: string;
        };
    }>;
    getMe(userId: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        role: Role;
        phone: string;
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: Role;
            phone: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string;
            email: string;
            role: Role;
            phone: string;
        };
    }>;
}
