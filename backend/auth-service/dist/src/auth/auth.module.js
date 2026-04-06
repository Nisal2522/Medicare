"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const admin_controller_1 = require("./admin/admin.controller");
const admin_service_1 = require("./admin/admin.service");
const auth_controller_1 = require("./auth.controller");
const auth_repository_1 = require("./auth.repository");
const auth_service_1 = require("./auth.service");
const public_landing_service_1 = require("./public-landing.service");
const landing_partner_schema_1 = require("./schemas/landing-partner.schema");
const user_schema_1 = require("./schemas/user.schema");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({ timeout: 15_000, maxRedirects: 3 }),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET ?? 'change-me-secret',
                signOptions: { expiresIn: '1d' },
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: landing_partner_schema_1.LandingPartner.name, schema: landing_partner_schema_1.LandingPartnerSchema },
            ]),
        ],
        controllers: [auth_controller_1.AuthController, admin_controller_1.AdminController],
        providers: [
            auth_service_1.AuthService,
            auth_repository_1.AuthRepository,
            public_landing_service_1.PublicLandingService,
            admin_service_1.AdminService,
            jwt_strategy_1.JwtStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
        ],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule, passport_1.PassportModule, jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map