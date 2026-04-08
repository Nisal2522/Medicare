import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
export declare class MedicalFileStorageService {
    private readonly config;
    private readonly s3Service;
    private readonly logger;
    constructor(config: ConfigService, s3Service: S3Service);
    saveUploadedFile(file: Express.Multer.File, subdir?: string): Promise<string>;
    resolvePublicReadUrl(fileUrl: string | null | undefined): Promise<string | null>;
    private isS3UploadFallbackError;
    private saveToLocalDisk;
    private safeExt;
    removeStoredFile(fileUrl: string): Promise<void>;
}
