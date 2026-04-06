import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DoctorSearchQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  specialty?: string;

  /** When "true", only doctors with at least one bookable availability slot */
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'], { message: 'availability must be "true" or "false"' })
  availability?: string;

  /**
   * Filter by weekday (e.g. Monday, Mon). Matched against `availability.day` (canonical full name).
   */
  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  day?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  location?: string;
}
