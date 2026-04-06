import { Role } from '../enums/role.enum';
export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    role: Role.PATIENT | Role.DOCTOR;
    phone?: string;
}
