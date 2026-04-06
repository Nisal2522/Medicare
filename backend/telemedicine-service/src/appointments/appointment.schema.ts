import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/** Read-only mirror of appointment-service collection for access checks */
export type AppointmentRefDocument = HydratedDocument<AppointmentRef>;

@Schema({ collection: 'appointments' })
export class AppointmentRef {
  @Prop({ type: Types.ObjectId, required: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  patientId?: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  patientEmail!: string;

  @Prop({ default: '' })
  status!: string;

  /** PENDING | APPROVED | REJECTED — video token requires APPROVED */
  @Prop({ default: 'PENDING' })
  doctorApprovalStatus!: string;
}

export const AppointmentRefSchema = SchemaFactory.createForClass(AppointmentRef);
