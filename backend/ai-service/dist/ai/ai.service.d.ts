import { HttpService } from '@nestjs/axios';
import { Model } from 'mongoose';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AnalyzeSymptomsDto } from './dto/analyze-symptoms.dto';
import { type SymptomAnalysisHistoryDocument } from './schemas/symptom-analysis-history.schema';
export type SymptomAnalysisResult = {
    summary: string;
    preliminaryCondition: string;
    detailedAnalysis: string;
    recommendedSpecialty: string;
    urgencyLevel: 'Low' | 'Medium' | 'High';
    disclaimer: string;
};
export declare class AiService {
    private readonly http;
    private readonly historyModel;
    private readonly log;
    constructor(http: HttpService, historyModel: Model<SymptomAnalysisHistoryDocument>);
    analyze(user: JwtPayload, payload: AnalyzeSymptomsDto): Promise<SymptomAnalysisResult>;
    listHistory(user: JwtPayload): Promise<{
        id: string;
        symptoms: string;
        age: number;
        gender: "Male" | "Female";
        summary: string;
        preliminaryCondition: string;
        recommendedSpecialty: string;
        urgencyLevel: "Low" | "Medium" | "High";
        createdAt: string | null;
    }[]>;
    private callGroq;
    private sendGroqChatCompletion;
    private isGroqModelDecommissioned;
    private normalize;
}
