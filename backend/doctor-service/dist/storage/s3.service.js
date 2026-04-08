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
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const path = __importStar(require("node:path"));
let S3Service = class S3Service {
    config;
    client;
    bucket;
    region;
    publicUrlBase;
    constructor(config) {
        this.config = config;
        this.region = this.config.get('AWS_S3_REGION') ?? 'us-east-1';
        this.bucket = this.config.get('AWS_S3_BUCKET_NAME') ?? '';
        const accessKeyId = this.config.get('AWS_S3_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('AWS_S3_SECRET_ACCESS_KEY');
        this.client = new client_s3_1.S3Client({
            region: this.region,
            credentials: accessKeyId && secretAccessKey
                ? { accessKeyId, secretAccessKey }
                : undefined,
        });
        const explicit = this.config.get('AWS_S3_PUBLIC_URL_BASE');
        this.publicUrlBase =
            explicit?.replace(/\/$/, '') ??
                (this.bucket
                    ? `https://${this.bucket}.s3.${this.region}.amazonaws.com`
                    : '');
    }
    async uploadFile(file, keyPrefix = 'doctor-avatars') {
        if (!this.bucket) {
            throw new Error('S3 is not configured (AWS_S3_BUCKET_NAME)');
        }
        const ext = path.extname(file.originalname || '') || '';
        const safeExt = ext.length <= 16 ? ext : '';
        const key = `${keyPrefix}/${(0, node_crypto_1.randomUUID)()}${safeExt}`;
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype || 'application/octet-stream',
        }));
        return `${this.publicUrlBase}/${key}`;
    }
    async deleteFileByPublicUrl(fileUrl) {
        if (!this.bucket || !this.publicUrlBase)
            return;
        const base = this.publicUrlBase.replace(/\/$/, '');
        const trimmed = fileUrl.trim();
        if (!trimmed.startsWith(base))
            return;
        const key = trimmed.slice(base.length).replace(/^\//, '');
        if (!key)
            return;
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
    async createSignedReadUrl(fileUrl, expiresInSeconds = 3600) {
        if (!this.bucket || !this.publicUrlBase) {
            return fileUrl;
        }
        const base = this.publicUrlBase.replace(/\/$/, '');
        const trimmed = fileUrl.trim();
        if (!trimmed.startsWith(base)) {
            return fileUrl;
        }
        const key = trimmed.slice(base.length).replace(/^\//, '');
        if (!key) {
            return fileUrl;
        }
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map