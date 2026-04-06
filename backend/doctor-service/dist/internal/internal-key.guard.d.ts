import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class InternalKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
