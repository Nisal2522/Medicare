import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({ _id: false })
export class AvailabilitySlot {
  @Prop({ required: true, trim: true })
  day!: string;

  @Prop({ required: true, trim: true })
  startTime!: string;

  @Prop({ required: true, trim: true })
  endTime!: string;

  @Prop({ required: true, min: 0 })
  maxPatients!: number;

  @Prop({ default: true })
  isAvailable!: boolean;
}

export const AvailabilitySlotSchema = SchemaFactory.createForClass(AvailabilitySlot);

@Schema({ collection: 'doctors', timestamps: true })
export class Doctor {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  specialty!: string;

  @Prop({ required: true, min: 0 })
  experience!: number;

  @Prop({ default: '' })
  qualification!: string;

  @Prop({ default: 0, min: 0 })
  consultationFee!: number;

  @Prop({ default: '' })
  profilePicture!: string;

  @Prop({ type: [AvailabilitySlotSchema], default: [] })
  availability!: AvailabilitySlot[];

  @Prop({ default: '' })
  location!: string;

  @Prop({ default: '' })
  hospital!: string;

  /** False until an admin verifies; only verified doctors appear in public search. */
  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

DoctorSchema.index({ name: 1 });
DoctorSchema.index({ specialty: 1 });
DoctorSchema.index({ specialty: 1, name: 1 });
/** Supports day filter + isAvailable (prefix usable for day-only queries) */
DoctorSchema.index({ 'availability.day': 1, 'availability.isAvailable': 1 });
