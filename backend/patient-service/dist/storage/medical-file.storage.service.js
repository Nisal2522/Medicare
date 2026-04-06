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
var MedicalFileStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalFileStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("node:fs/promises");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const s3_service_1 = require("./s3.service");
let MedicalFileStorageService = MedicalFileStorageService_1 = class MedicalFileStorageService {
    config;
    s3Service;
    logger = new common_1.Logger(MedicalFileStorageService_1.name);
    constructor(config, s3Service) {
        this.config = config;
        this.s3Service = s3Service;
    }
    async saveUploadedFile(file, subdir = 'medical-reports') {
        const bucket = this.config.get('AWS_S3_BUCKET_NAME')?.trim();
        if (bucket) {
            return this.s3Service.uploadFile(file, subdir);
        }
        return this.saveToLocalDisk(file, subdir);
    }
    async saveToLocalDisk(file, relDir) {
        const ext = this.safeExt(file.originalname);
        const name = `${(0, node_crypto_1.randomUUID)()}${ext}`;
        const absDir = (0, node_path_1.join)(process.cwd(), 'uploads', relDir);
        await (0, promises_1.mkdir)(absDir, { recursive: true });
        const absPath = (0, node_path_1.join)(absDir, name);
        await (0, promises_1.writeFile)(absPath, file.buffer);
        const port = this.config.get('PORT') ?? process.env.PORT ?? '3004';
        const base = (this.config.get('PATIENT_API_PUBLIC_URL') ??
            `http://localhost:${port}`).replace(/\/$/, '');
        return `${base}/uploads/${relDir}/${name}`;
    }
    safeExt(originalName) {
        const ext = (0, node_path_1.extname)(originalName || '') || '';
        return ext.length <= 16 ? ext : '';
    }
    async removeStoredFile(fileUrl) {
        const url = fileUrl?.trim();
        if (!url) {
            return;
        }
        let pathname = '';
        try {
            pathname = new URL(url).pathname.replace(/^\/+/, '');
        }
        catch {
            return;
        }
        if (pathname.startsWith('uploads/')) {
            try {
                const uploadsRoot = (0, node_path_1.resolve)((0, node_path_1.join)(process.cwd(), 'uploads'));
                const abs = (0, node_path_1.resolve)((0, node_path_1.join)(process.cwd(), pathname));
                if (abs.startsWith(uploadsRoot)) {
                    await (0, promises_1.unlink)(abs);
                }
            }
            catch (err) {
                this.logger.warn(`Local file delete skipped (${err instanceof Error ? err.message : err})`);
            }
            return;
        }
        const bucket = this.config.get('AWS_S3_BUCKET_NAME')?.trim();
        if (bucket) {
            try {
                await this.s3Service.deleteFileByPublicUrl(url);
            }
            catch (err) {
                this.logger.warn(`S3 delete failed (${err instanceof Error ? err.message : err})`);
            }
        }
    }
};
exports.MedicalFileStorageService = MedicalFileStorageService;
exports.MedicalFileStorageService = MedicalFileStorageService = MedicalFileStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        s3_service_1.S3Service])
], MedicalFileStorageService);
//# sourceMappingURL=medical-file.storage.service.js.map