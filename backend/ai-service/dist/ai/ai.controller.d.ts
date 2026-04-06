import type { Request } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AiService } from './ai.service';
import { AnalyzeSymptomsDto } from './dto/analyze-symptoms.dto';
export declare class AiController {
    private readonly ai;
    constructor(ai: AiService);
    analyze(dto: AnalyzeSymptomsDto, req: Request & {
        user: JwtPayload;
    }): Promise<import("./ai.service").SymptomAnalysisResult>;
}
