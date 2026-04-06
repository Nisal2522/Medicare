import { ConfigService } from '@nestjs/config';
export declare class S3Service {
    private readonly config;
    private readonly client;
    private readonly bucket;
    private readonly region;
    private readonly publicUrlBase;
    constructor(config: ConfigService);
    uploadFile(file: Express.Multer.File, keyPrefix?: string): Promise<string>;
    deleteFileByPublicUrl(fileUrl: string): Promise<void>;
}
