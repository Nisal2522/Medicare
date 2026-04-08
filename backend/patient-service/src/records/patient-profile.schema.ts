import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PatientProfileDocument = HydratedDocument<PatientProfile>;

@Schema({ timestamps: true, collection: 'patient_profiles' })
export class PatientProfile {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, default: '' })
  avatarUrl!: string;

  @Prop({ type: Number, min: 0, max: 130 })
  age?: number;

  @Prop({ type: String, default: '' })
  gender?: string;
}

export const PatientProfileSchema = SchemaFactory.createForClass(PatientProfile);
