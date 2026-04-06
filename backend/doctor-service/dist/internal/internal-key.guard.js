"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalKeyGuard = void 0;
const common_1 = require("@nestjs/common");
let InternalKeyGuard = class InternalKeyGuard {
    canActivate(context) {
        const expected = process.env.INTERNAL_SERVICE_KEY?.trim();
        if (!expected) {
            throw new common_1.ForbiddenException('Internal provisioning is disabled');
        }
        const req = context.switchToHttp().getRequest();
        const key = req.headers?.['x-service-key'] ?? req.headers?.['X-Service-Key'];
        if (key !== expected) {
            throw new common_1.ForbiddenException('Invalid service key');
        }
        return true;
    }
};
exports.InternalKeyGuard = InternalKeyGuard;
exports.InternalKeyGuard = InternalKeyGuard = __decorate([
    (0, common_1.Injectable)()
], InternalKeyGuard);
//# sourceMappingURL=internal-key.guard.js.map