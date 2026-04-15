"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelecomModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("../auth/jwt.strategy");
const telecom_controller_1 = require("./telecom.controller");
const telecom_service_1 = require("./telecom.service");
const video_session_schema_1 = require("./video-session.schema");
let TelecomModule = class TelecomModule {
};
exports.TelecomModule = TelecomModule;
exports.TelecomModule = TelecomModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: video_session_schema_1.VideoSession.name, schema: video_session_schema_1.VideoSessionSchema },
            ]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    secret: cfg.get('JWT_SECRET')?.trim() ?? 'change-me-secret',
                    signOptions: { expiresIn: '1d' },
                }),
            }),
        ],
        controllers: [telecom_controller_1.TelecomController],
        providers: [telecom_service_1.TelecomService, jwt_strategy_1.JwtStrategy],
    })
], TelecomModule);
//# sourceMappingURL=telecom.module.js.map