import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PatientPaymentDocument = HydratedDocument<PatientPayment>;

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Schema({ collection: 'patient_payments', timestamps: true })
export class PatientPayment {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  patientId!: Types.ObjectId;

  /** Amount in smallest currency unit (e.g. cents) */
  @Prop({ required: true })
  amountCents!: number;

  @Prop({ default: 'LKR', trim: true })
  currency!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PAID })
  status!: PaymentStatus;

  @Prop({ default: '' })
  reference!: string;

  @Prop({ type: String, default: null })
  appointmentId!: string | null;
}

export const PatientPaymentSchema =
  SchemaFactory.createForClass(PatientPayment);

PatientPaymentSchema.index({ patientId: 1, createdAt: -1 });
