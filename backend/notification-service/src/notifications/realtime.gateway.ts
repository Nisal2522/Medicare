import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { verify } from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';

type SocketJwtPayload = {
  sub: string;
  email?: string;
  role?: string;
};

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean).length
      ? (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean)
      : '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly config: ConfigService) {}

  handleConnection(client: Socket): void {
    const token = this.extractToken(client);
    const payload = this.decodePayload(token);
    if (!payload) {
      client.disconnect(true);
      return;
    }

    const email = payload.email?.trim().toLowerCase();
    client.join(`user:${payload.sub}`);
    if (email) {
      client.join(`email:${email}`);
    }
    if (payload.role) {
      client.join(`role:${payload.role.toUpperCase()}`);
    }

    this.logger.debug(`socket connected ${client.id} user=${payload.sub}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket disconnected ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: Record<string, unknown>): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToEmail(
    email: string,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    this.server.to(`email:${email.trim().toLowerCase()}`).emit(event, payload);
  }

  emitToRole(
    role: string,
    event: string,
    payload: Record<string, unknown>,
  ): void {
    this.server.to(`role:${role.toUpperCase()}`).emit(event, payload);
  }

  @SubscribeMessage('ping')
  onPing(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return {
      ok: true,
      ts: Date.now(),
      echo: body ?? null,
      socketId: client.id,
    };
  }

  private extractToken(client: Socket): string {
    const authToken =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : '';
    if (authToken) {
      return authToken;
    }

    const q = client.handshake.query?.token;
    if (typeof q === 'string') {
      return q;
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return '';
  }

  private decodePayload(token: string): SocketJwtPayload | null {
    if (!token) return null;
    const secret = this.config.get<string>('JWT_SECRET') ?? 'change-me-secret';
    try {
      return verify(token, secret) as SocketJwtPayload;
    } catch {
      return null;
    }
  }
}
