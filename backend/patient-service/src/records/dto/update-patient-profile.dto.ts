import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

function toOptionalInt(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function trimLowerOrUndef(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  const v = String(value).trim().toLowerCase();
  return v === '' ? undefined : v;
}

export class UpdatePatientProfileDto {
  @IsOptional()
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(0)
  @Max(130)
  age?: number;

  @IsOptional()
  @Transform(({ value }) => trimLowerOrUndef(value))
  @IsIn(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;
}
