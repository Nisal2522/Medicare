import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { NotificationStoreService } from './notification-store.service';

type JwtPayload = {
  sub: string;
  email?: string;
  role?: string;
};

@Controller('notifications')
export class UserNotificationsController {
  constructor(private readonly store: NotificationStoreService) {}

  @Get('me')
  async listMine(
    @Headers('authorization') authorization: string | undefined,
    @Query('limit') limitRaw?: string,
  ) {
    const me = this.parseUser(authorization);
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    return this.store.listForUser(me.sub, limit ?? 50);
  }

  @Patch('me/read-all')
  async readAll(@Headers('authorization') authorization: string | undefined) {
    const me = this.parseUser(authorization);
    const updated = await this.store.markAllRead(me.sub);
    return { updated };
  }

  @Patch(':id/read')
  async readOne(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const me = this.parseUser(authorization);
    if (!id?.trim()) {
      throw new BadRequestException('Notification id is required');
    }
    const updated = await this.store.markRead(me.sub, id.trim());
    return { updated };
  }

  @Delete('me')
  async clearAll(@Headers('authorization') authorization: string | undefined) {
    const me = this.parseUser(authorization);
    const deleted = await this.store.clearAll(me.sub);
    return { deleted };
  }

  @Delete('me/read')
  async clearRead(@Headers('authorization') authorization: string | undefined) {
    const me = this.parseUser(authorization);
    const deleted = await this.store.clearRead(me.sub);
    return { deleted };
  }

  @Delete(':id')
  async clearOne(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const me = this.parseUser(authorization);
    if (!id?.trim()) {
      throw new BadRequestException('Notification id is required');
    }
    const deleted = await this.store.clearOne(me.sub, id.trim());
    return { deleted };
  }

  private parseUser(authorization: string | undefined): JwtPayload {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authorization.slice(7).trim();
    const secret = process.env.JWT_SECRET ?? 'change-me-secret';
    try {
      return verify(token, secret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

