import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AppointmentRef } from '../appointments/appointment.schema';
export declare class TelecomService {
    private readonly appointmentModel;
    private readonly config;
    constructor(appointmentModel: Model<AppointmentRef>, config: ConfigService);
    getRtcToken(user: JwtPayload, channelName: string): Promise<{
        token: string;
        appId: string;
        channelName: string;
        uid: number;
        expiresIn: number;
        expiresAt: number;
    }>;
    private buildTokenForAppointment;
    private effectiveDoctorApproval;
    private loadAppointmentForTelecom;
    private fetchAppointmentFromAppointmentService;
    private assertParticipant;
    uidFromSub(sub: string): number;
}
