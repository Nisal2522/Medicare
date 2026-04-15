import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<AppNotification>;

@Schema({ collection: 'notifications', timestamps: true })
export class AppNotification {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: false, index: true })
  userEmail?: string;

  @Prop({ required: true, default: 'general' })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, default: '' })
  message!: string;

  @Prop({ type: Object, default: {} })
  meta!: Record<string, unknown>;

  @Prop({ required: true, default: false, index: true })
  isRead!: boolean;

  @Prop({ required: false })
  readAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const AppNotificationSchema = SchemaFactory.createForClass(AppNotification);

