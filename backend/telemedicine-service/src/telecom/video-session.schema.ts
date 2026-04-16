import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VideoSessionDocument = HydratedDocument<VideoSession>;

@Schema({ collection: 'video_sessions', timestamps: true })
export class VideoSession {
  @Prop({ required: true, trim: true, unique: true, index: true })
  roomName!: string;

  @Prop({ required: true, trim: true, index: true })
  appointmentId!: string;

  @Prop({ required: true, trim: true, index: true })
  doctorId!: string;

  @Prop({ required: true, trim: true, index: true })
  patientId!: string;

  @Prop({ required: true, enum: ['WAITING', 'ACTIVE', 'ENDED'], default: 'WAITING' })
  status!: 'WAITING' | 'ACTIVE' | 'ENDED';

  @Prop({ required: false })
  startedAt?: Date;

  @Prop({ required: false })
  endedAt?: Date;

  @Prop({ required: false, min: 0 })
  durationMinutes?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VideoSessionSchema = SchemaFactory.createForClass(VideoSession);

