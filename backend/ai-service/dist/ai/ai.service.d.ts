import { HttpService } from '@nestjs/axios';
import type { JwtPayload } from '../auth/jwt.strategy';
export type SymptomAnalysisResult = {
    possibleCondition: string;
    recommendedSpecialty: string;
    urgencyLevel: 'Low' | 'Medium' | 'High';
    disclaimer: string;
};
export declare class AiService {
    private readonly http;
    constructor(http: HttpService);
    analyze(user: JwtPayload, symptoms: string): Promise<SymptomAnalysisResult>;
    private callOpenAi;
    private normalize;
    heuristicFallback(symptoms: string): SymptomAnalysisResult;
}
