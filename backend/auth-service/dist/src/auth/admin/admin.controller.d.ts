import type { Request } from 'express';
import { AdminService } from './admin.service';
type JwtReqUser = {
    sub: string;
    email: string;
    role: string;
};
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    listUsers(): Promise<import("./admin.service").AdminUserRow[]>;
    deactivate(req: Request & {
        user: JwtReqUser;
    }, id: string): Promise<{
        message: string;
    }>;
    verifyDoctor(authorization: string | undefined, id: string): Promise<unknown>;
    stats(authorization: string | undefined): Promise<{
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
}
export {};
