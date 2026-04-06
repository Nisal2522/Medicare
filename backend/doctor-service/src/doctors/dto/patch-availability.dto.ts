import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class AvailabilitySlotInputDto {
  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxPatients?: number;
}

export class DayAvailabilityInputDto {
  /** Canonical weekday e.g. Monday (also accepts Mon — normalized in service) */
  @IsString()
  day!: string;

  /** When true, doctor is not available this day (no slots stored). */
  @IsBoolean()
  closed!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotInputDto)
  slots!: AvailabilitySlotInputDto[];
}

export class PatchAvailabilityDto {
  /** Exactly one entry per weekday you manage; typically Mon–Sun (7 items). */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DayAvailabilityInputDto)
  days!: DayAvailabilityInputDto[];
}
