import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
}

/** Doctor must approve before patients can join video (legacy rows without field treated as approved if already confirmed). */
export enum DoctorApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ type: Types.ObjectId, required: true })
  doctorId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  doctorName!: string;

  @Prop({ trim: true })
  doctorSpecialty?: string;

  @Prop({ type: Types.ObjectId })
  patientId?: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  patientEmail!: string;

  @Prop({ required: true, trim: true })
  patientName!: string;

  @Prop({ trim: true })
  patientPhone?: string;

  @Prop({ trim: true })
  doctorPhone?: string;

  @Prop({ trim: true, lowercase: true })
  doctorEmail?: string;

  @Prop({ required: true })
  appointmentDateKey!: string;

  @Prop({ required: true })
  day!: string;

  @Prop({ required: true })
  startTime!: string;

  @Prop({ required: true })
  endTime!: string;

  @Prop({ type: Number, default: 0 })
  consultationFee!: number;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING_PAYMENT,
  })
  status!: AppointmentStatus;

  @Prop({
    type: String,
    enum: DoctorApprovalStatus,
    default: DoctorApprovalStatus.PENDING,
  })
  doctorApprovalStatus!: DoctorApprovalStatus;

  @Prop({ default: 'Pending payment' })
  paymentStatus!: string;

  @Prop({ type: Number, default: 0, min: 0 })
  paymentFailureCount!: number;

  @Prop({ required: true })
  slotKey!: string;

  @Prop({ type: Number, min: 1 })
  slotSeat?: number;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index(
  { doctorId: 1, appointmentDateKey: 1, slotKey: 1 },
);

AppointmentSchema.index(
  { doctorId: 1, appointmentDateKey: 1, slotKey: 1, slotSeat: 1 },
  {
    unique: true,
    partialFilterExpression: { slotSeat: { $type: 'number' } },
  },
);
