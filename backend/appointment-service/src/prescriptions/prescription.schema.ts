import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PrescriptionDocument = HydratedDocument<Prescription>;

@Schema({ timestamps: true, collection: 'prescriptions' })
export class Prescription {
  @Prop({ type: Types.ObjectId })
  patientId?: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  patientEmail!: string;

  @Prop({ type: Types.ObjectId, required: true })
  doctorId!: Types.ObjectId;

  @Prop({ trim: true })
  doctorName?: string;

  @Prop({ type: Types.ObjectId, required: true })
  appointmentId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  diagnosis!: string;

  @Prop({ trim: true })
  symptoms?: string;

  @Prop({ trim: true })
  clinicalNotes?: string;

  @Prop({ trim: true })
  specialAdvice?: string;

  @Prop({ trim: true })
  labTests?: string;

  @Prop()
  followUpDate?: Date;

  @Prop({ trim: true })
  patientName?: string;

  @Prop({ trim: true })
  patientAge?: string;

  @Prop({ trim: true })
  patientGender?: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String },
        duration: { type: String, required: true },
        instructions: { type: String },
      },
    ],
    default: [],
  })
  medicines!: {
    name: string;
    dosage: string;
    frequency?: string;
    duration: string;
    instructions?: string;
  }[];
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);
