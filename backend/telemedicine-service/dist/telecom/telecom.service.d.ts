import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import type { JwtPayload } from '../auth/jwt.strategy';
import { type VideoSessionDocument } from './video-session.schema';
export declare class TelecomService {
    private readonly videoSessionModel;
    private readonly config;
    constructor(videoSessionModel: Model<VideoSessionDocument>, config: ConfigService);
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
    private upsertVideoSession;
    uidFromSub(sub: string): number;
}
