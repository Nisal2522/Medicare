import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, join, resolve } from 'node:path';
import { S3Service } from './s3.service';

/**
 * Uses S3 when `AWS_S3_BUCKET_NAME` is set; otherwise stores under `./uploads`
 * and serves via `/uploads/...` (see `main.ts`).
 */
@Injectable()
export class MedicalFileStorageService {
  private readonly logger = new Logger(MedicalFileStorageService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  async saveUploadedFile(
    file: Express.Multer.File,
    subdir = 'medical-reports',
  ): Promise<string> {
    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME')?.trim();
    if (bucket) {
      try {
        return await this.s3Service.uploadFile(file, subdir);
      } catch (err) {
        if (this.isS3UploadFallbackError(err)) {
          this.logger.warn(
            `S3 upload failed, falling back to local storage (${err instanceof Error ? err.message : String(err)})`,
          );
          return this.saveToLocalDisk(file, subdir);
        }
        throw err;
      }
    }
    return this.saveToLocalDisk(file, subdir);
  }

  async resolvePublicReadUrl(fileUrl: string | null | undefined): Promise<string | null> {
    const url = fileUrl?.trim();
    if (!url) {
      return null;
    }

    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME')?.trim();
    if (!bucket) {
      return url;
    }

    try {
      return await this.s3Service.createSignedReadUrl(url);
    } catch (err) {
      this.logger.warn(
        `S3 sign URL failed, using stored URL (${err instanceof Error ? err.message : String(err)})`,
      );
      return url;
    }
  }

  private isS3UploadFallbackError(err: unknown): boolean {
    if (!(err instanceof Error)) {
      return false;
    }

    const message = `${err.name} ${err.message}`.toLowerCase();
    return [
      'accessdenied',
      'invalidaccesskeyid',
      'signaturedoesnotmatch',
      'nosuchbucket',
      'permanentredirect',
      'all access to this object has been disabled',
    ].some((token) => message.includes(token));
  }

  private async saveToLocalDisk(
    file: Express.Multer.File,
    relDir: string,
  ): Promise<string> {
    const ext = this.safeExt(file.originalname);
    const name = `${randomUUID()}${ext}`;
    const absDir = join(process.cwd(), 'uploads', relDir);
    await mkdir(absDir, { recursive: true });
    const absPath = join(absDir, name);
    await writeFile(absPath, file.buffer);

    const port = this.config.get<string>('PORT') ?? process.env.PORT ?? '3004';
    const base = (
      this.config.get<string>('PATIENT_API_PUBLIC_URL') ??
      `http://localhost:${port}`
    ).replace(/\/$/, '');

    return `${base}/uploads/${relDir}/${name}`;
  }

  private safeExt(originalName: string | undefined): string {
    const ext = extname(originalName || '') || '';
    return ext.length <= 16 ? ext : '';
  }

  /**
   * Removes S3 object or local file when the URL was produced by this service.
   * External/demo URLs are skipped. Failures are logged, not thrown.
   */
  async removeStoredFile(fileUrl: string): Promise<void> {
    const url = fileUrl?.trim();
    if (!url) {
      return;
    }

    let pathname = '';
    try {
      pathname = new URL(url).pathname.replace(/^\/+/, '');
    } catch {
      return;
    }

    if (pathname.startsWith('uploads/')) {
      try {
        const uploadsRoot = resolve(join(process.cwd(), 'uploads'));
        const abs = resolve(join(process.cwd(), pathname));
        if (abs.startsWith(uploadsRoot)) {
          await unlink(abs);
        }
      } catch (err) {
        this.logger.warn(
          `Local file delete skipped (${err instanceof Error ? err.message : err})`,
        );
      }
      return;
    }

    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME')?.trim();
    if (bucket) {
      try {
        await this.s3Service.deleteFileByPublicUrl(url);
      } catch (err) {
        this.logger.warn(
          `S3 delete failed (${err instanceof Error ? err.message : err})`,
        );
      }
    }
  }
}
