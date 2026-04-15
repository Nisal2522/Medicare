import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AppNotification,
  type NotificationDocument,
} from './notification.schema';

type PushInput = {
  userId: string;
  userEmail?: string;
  type: string;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class NotificationStoreService {
  constructor(
    @InjectModel(AppNotification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async push(input: PushInput): Promise<void> {
    await this.notificationModel.create({
      userId: input.userId,
      userEmail: input.userEmail?.trim().toLowerCase(),
      type: input.type,
      title: input.title,
      message: input.message,
      meta: input.meta ?? {},
      isRead: false,
    });
  }

  async listForUser(userId: string, limit = 50) {
    const safeLimit = Math.min(200, Math.max(1, limit));
    const rows = await this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean()
      .exec();
    return rows.map((r) => ({
      id: String(r._id),
      type: r.type,
      title: r.title,
      message: r.message,
      meta: (r.meta ?? {}) as Record<string, unknown>,
      isRead: Boolean(r.isRead),
      readAt: r.readAt ? new Date(r.readAt).toISOString() : null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    }));
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const out = await this.notificationModel
      .updateOne(
        { _id: notificationId, userId },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return (out.modifiedCount ?? 0) > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const out = await this.notificationModel
      .updateMany(
        { userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      )
      .exec();
    return out.modifiedCount ?? 0;
  }

  async clearAll(userId: string): Promise<number> {
    const out = await this.notificationModel.deleteMany({ userId }).exec();
    return out.deletedCount ?? 0;
  }

  async clearRead(userId: string): Promise<number> {
    const out = await this.notificationModel
      .deleteMany({ userId, isRead: true })
      .exec();
    return out.deletedCount ?? 0;
  }

  async clearOne(userId: string, notificationId: string): Promise<number> {
    const out = await this.notificationModel
      .deleteOne({ _id: notificationId, userId })
      .exec();
    return out.deletedCount ?? 0;
  }
}

