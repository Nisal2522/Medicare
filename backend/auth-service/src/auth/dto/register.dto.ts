import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

/** Public signup: PATIENT or DOCTOR only (ADMIN is provisioned separately). */
const REGISTER_ROLES = [Role.PATIENT, Role.DOCTOR] as const;

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(REGISTER_ROLES, { message: 'role must be PATIENT or DOCTOR' })
  role!: Role.PATIENT | Role.DOCTOR;

  @IsOptional()
  @IsString()
  phone?: string;
}
