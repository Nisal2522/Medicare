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
      throw new ForbiddenException('Internal provisioning is disabled');
    }
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string> }>();
    const key = req.headers?.['x-service-key'] ?? req.headers?.['X-Service-Key'];
    if (key !== expected) {
      throw new ForbiddenException('Invalid service key');
    }
    return true;
  }
}
