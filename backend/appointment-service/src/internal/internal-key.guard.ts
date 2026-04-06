import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_SERVICE_KEY?.trim();
    if (!expected) {
      throw new ForbiddenException('Internal API is not configured');
    }
    const req = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const key =
      req.headers?.['x-service-key'] ?? req.headers?.['X-Service-Key'];
    const v = Array.isArray(key) ? key[0] : key;
    if (v !== expected) {
      throw new ForbiddenException('Invalid service key');
    }
    return true;
  }
}
