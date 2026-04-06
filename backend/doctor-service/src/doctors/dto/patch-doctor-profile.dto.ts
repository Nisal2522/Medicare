import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PatchDoctorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  qualification?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hospital?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  profilePicture?: string;
}
