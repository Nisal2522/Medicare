import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
export type AdminUserRow = {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
};
export declare class AdminService {
    private readonly userModel;
    private readonly http;
    constructor(userModel: Model<UserDocument>, http: HttpService);
    listUsers(): Promise<AdminUserRow[]>;
    deactivateUser(actorSub: string, targetId: string): Promise<{
        message: string;
    }>;
    getStats(authorization: string | undefined): Promise<{
        totalPatients: number;
        totalDoctors: number;
        totalAppointments: number;
        totalRevenue: number;
        newSignUpsToday: number;
        monthlyRevenue: {
            month: string;
            revenue: number;
        }[];
    }>;
    private countSignupsSinceUtcMidnight;
    verifyDoctor(authorization: string | undefined, doctorId: string): Promise<unknown>;
    provisionDoctorProfile(userId: string, fullName: string): Promise<void>;
}
