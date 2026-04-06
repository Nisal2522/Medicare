import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class ProvisionDoctorDto {
  @IsMongoId()
  userId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;
}
