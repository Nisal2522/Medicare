"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const microservices_1 = require("@nestjs/microservices");
const bcrypt = __importStar(require("bcrypt"));
const rxjs_1 = require("rxjs");
const admin_service_1 = require("./admin/admin.service");
const auth_repository_1 = require("./auth.repository");
const role_enum_1 = require("./enums/role.enum");
let AuthService = class AuthService {
    authRepository;
    jwtService;
    adminService;
    notificationsClient;
    constructor(authRepository, jwtService, adminService, notificationsClient) {
        this.authRepository = authRepository;
        this.jwtService = jwtService;
        this.adminService = adminService;
        this.notificationsClient = notificationsClient;
    }
    async register(dto) {
        const existingUser = await this.authRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
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
        if (dto.role === role_enum_1.Role.DOCTOR) {
            try {
                await this.adminService.provisionDoctorProfile(userId, dto.fullName);
            }
            catch (e) {
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
    async emitRegistrationEmail(payload) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.notificationsClient.emit('user_registered', {
                userId: payload.userId,
                email: payload.email,
                fullName: payload.fullName,
                role: payload.role,
            }));
        }
        catch {
        }
    }
    async getMe(userId) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            id: String(user._id),
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone ?? '',
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.authRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.newPassword != null && dto.newPassword.length > 0) {
            if (!dto.currentPassword?.length) {
                throw new common_1.BadRequestException('Current password is required to set a new password');
            }
            const ok = await bcrypt.compare(dto.currentPassword, user.password);
            if (!ok) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            user.password = await bcrypt.hash(dto.newPassword, 10);
        }
        if (dto.email != null && dto.email.trim().toLowerCase() !== user.email) {
            const nextEmail = dto.email.trim().toLowerCase();
            const taken = await this.authRepository.findByEmail(nextEmail);
            if (taken && String(taken._id) !== userId) {
                throw new common_1.ConflictException('Email is already in use');
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
    async login(dto) {
        const user = await this.authRepository.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValidPassword = await bcrypt.compare(dto.password, user.password);
        if (!isValidPassword) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.isActive === false) {
            throw new common_1.UnauthorizedException('Account is deactivated');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)('NOTIFICATIONS_CLIENT')),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        jwt_1.JwtService,
        admin_service_1.AdminService,
        microservices_1.ClientProxy])
], AuthService);
//# sourceMappingURL=auth.service.js.map