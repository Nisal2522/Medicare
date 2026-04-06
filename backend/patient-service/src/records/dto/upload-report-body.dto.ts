import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

function trimOrUndef(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export class UploadReportBodyDto {
  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  title?: string;

  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  @IsIn(['prescription', 'blood', 'imaging', 'general'])
  category?: string;

  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  doctorName?: string;

  @IsOptional()
  @Transform(({ value }) => trimOrUndef(value))
  @IsString()
  specialty?: string;
}
