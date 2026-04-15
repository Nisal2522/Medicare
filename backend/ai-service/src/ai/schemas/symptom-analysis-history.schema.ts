import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SymptomAnalysisHistoryDocument =
  HydratedDocument<SymptomAnalysisHistory>;

@Schema({ timestamps: true, collection: 'symptom_analysis_history' })
export class SymptomAnalysisHistory {
  @Prop({ required: true, index: true, trim: true })
  userId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  userEmail!: string;

  @Prop({ required: true, trim: true })
  symptoms!: string;

  @Prop({ required: true, min: 0, max: 120 })
  age!: number;

  @Prop({ required: true, enum: ['Male', 'Female'] })
  gender!: 'Male' | 'Female';

  @Prop({ required: true, trim: true })
  summary!: string;

  @Prop({ required: true, trim: true })
  preliminaryCondition!: string;

  @Prop({ required: true, trim: true })
  detailedAnalysis!: string;

  @Prop({ required: true, trim: true })
  recommendedSpecialty!: string;

  @Prop({ required: true, enum: ['Low', 'Medium', 'High'] })
  urgencyLevel!: 'Low' | 'Medium' | 'High';

  @Prop({ required: true, trim: true })
  disclaimer!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SymptomAnalysisHistorySchema = SchemaFactory.createForClass(
  SymptomAnalysisHistory,
);

