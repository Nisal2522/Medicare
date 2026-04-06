import type { Request } from 'express';
import { AuthService } from './auth.service';
import { PublicLandingService } from './public-landing.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
type JwtReqUser = {
    sub: string;
    email: string;
    role: string;
};
export declare class AuthController {
    private readonly authService;
    private readonly publicLanding;
    constructor(authService: AuthService, publicLanding: PublicLandingService);
    register(dto: RegisterDto): Promise<{
        message: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string;
            email: string;
            role: import("./enums/role.enum").Role;
            phone: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            fullName: string;
            email: string;
            role: import("./enums/role.enum").Role;
            phone: string;
        };
    }>;
    getPublicLanding(): Promise<{
        doctorCount: number;
        patientCount: number;
        partners: string[];
    }>;
    me(req: Request & {
        user: JwtReqUser;
    }): Promise<{
        id: string;
        fullName: string;
        email: string;
        role: import("./enums/role.enum").Role;
        phone: string;
    }>;
    patchMe(req: Request & {
        user: JwtReqUser;
    }, dto: UpdateProfileDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: import("./enums/role.enum").Role;
            phone: string;
        };
    }>;
}
export {};
