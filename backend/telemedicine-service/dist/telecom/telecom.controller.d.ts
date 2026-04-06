import type { JwtPayload } from '../auth/jwt.strategy';
import { TelecomService } from './telecom.service';
export declare class TelecomController {
    private readonly telecomService;
    constructor(telecomService: TelecomService);
    getToken(req: {
        user: JwtPayload;
    }, channelName: string): Promise<{
        token: string;
        appId: string;
        channelName: string;
        uid: number;
        expiresIn: number;
        expiresAt: number;
    }>;
}
