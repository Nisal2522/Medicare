import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppointmentAccessDocument = HydratedDocument<AppointmentAccess>;

@Schema({ collection: 'appointments', timestamps: false })
export class AppointmentAccess {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, default: 'PENDING' })
  doctorApprovalStatus!: string;

  @Prop({ type: String, default: 'PENDING_PAYMENT' })
  status!: string;
}

export const AppointmentAccessSchema =
  SchemaFactory.createForClass(AppointmentAccess);
