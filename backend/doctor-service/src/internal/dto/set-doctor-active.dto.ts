import { IsBoolean, IsMongoId } from 'class-validator';

export class SetDoctorActiveDto {
  @IsMongoId()
  userId!: string;

  @IsBoolean()
  isActive!: boolean;
}
