import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum MedicalRecordType {
  PRESCRIPTION = 'prescription',
  REPORT = 'report',
}

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>;

@Schema({ collection: 'medical_records', timestamps: true })
export class MedicalRecord {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, enum: MedicalRecordType, required: true })
  type!: MedicalRecordType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  doctorName!: string;

  @Prop({ default: '' })
  specialty!: string;

  /** UI category: prescription | blood | imaging | general (patient uploads). */
  @Prop({ default: '' })
  reportCategory!: string;

  @Prop({ required: true, trim: true })
  fileName!: string;

  /** Placeholder URL — replace with object storage in production */
  @Prop({ required: true, trim: true })
  fileUrl!: string;
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);

MedicalRecordSchema.index({ patientId: 1, createdAt: -1 });
