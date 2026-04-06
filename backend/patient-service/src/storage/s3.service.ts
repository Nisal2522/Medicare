import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicUrlBase: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_S3_REGION') ?? 'us-east-1';
    this.bucket = this.config.get<string>('AWS_S3_BUCKET_NAME') ?? '';

    const accessKeyId = this.config.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_S3_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: this.region,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });

    const explicit = this.config.get<string>('AWS_S3_PUBLIC_URL_BASE');
    this.publicUrlBase =
      explicit?.replace(/\/$/, '') ??
      (this.bucket
        ? `https://${this.bucket}.s3.${this.region}.amazonaws.com`
        : '');
  }

  async uploadFile(
    file: Express.Multer.File,
    keyPrefix = 'medical-reports',
  ): Promise<string> {
    if (!this.bucket) {
      throw new Error('S3 is not configured (AWS_S3_BUCKET_NAME)');
    }

    const ext = path.extname(file.originalname || '') || '';
    const safeExt = ext.length <= 16 ? ext : '';
    const key = `${keyPrefix}/${randomUUID()}${safeExt}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      }),
    );

    return `${this.publicUrlBase}/${key}`;
  }

  /** Best-effort remove; ignores URLs that are not served from this bucket/base. */
  async deleteFileByPublicUrl(fileUrl: string): Promise<void> {
    if (!this.bucket || !this.publicUrlBase) {
      return;
    }
    const key = this.extractKeyFromPublicUrl(fileUrl);
    if (!key) {
      return;
    }
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async createSignedReadUrl(fileUrl: string, expiresInSeconds = 1800): Promise<string> {
    const key = this.extractKeyFromPublicUrl(fileUrl);
    if (!key || !this.bucket) {
      return fileUrl;
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  private extractKeyFromPublicUrl(fileUrl: string): string | null {
    if (!this.bucket || !this.publicUrlBase) {
      return null;
    }
    const base = this.publicUrlBase.replace(/\/$/, '');
    const trimmed = fileUrl.trim();
    if (!trimmed.startsWith(base)) {
      return null;
    }
    const key = trimmed.slice(base.length).replace(/^\//, '');
    return key || null;
  }
}
