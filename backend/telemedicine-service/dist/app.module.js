"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const path_1 = require("path");
const telecom_module_1 = require("./telecom/telecom.module");
function stripQuotes(s) {
    return s.replace(/^["']|["']$/g, '').trim();
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                expandVariables: true,
                envFilePath: [(0, path_1.join)(process.cwd(), '.env'), (0, path_1.join)(__dirname, '..', '.env')],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => {
                    const raw = cfg.get('MONGO_URI')?.trim() ||
                        cfg.get('MONGODB_URI')?.trim() ||
                        'mongodb://localhost:27017/healthcare-platform';
                    return { uri: stripQuotes(raw) };
                },
            }),
            telecom_module_1.TelecomModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map