import {
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../enums/role.enum';
import { AdminService } from './admin.service';

type JwtReqUser = { sub: string; email: string; role: string };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/deactivate')
  deactivate(
    @Req() req: Request & { user: JwtReqUser },
    @Param('id') id: string,
  ) {
    return this.adminService.deactivateUser(req.user.sub, id);
  }

  @Patch('users/:id/activate')
  activate(
    @Req() req: Request & { user: JwtReqUser },
    @Param('id') id: string,
  ) {
    return this.adminService.activateUser(req.user.sub, id);
  }

  @Patch('verify-doctor/:id')
  verifyDoctor(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.adminService.verifyDoctor(authorization, id);
  }

  @Get('stats')
  stats(@Headers('authorization') authorization: string | undefined) {
    return this.adminService.getStats(authorization);
  }
}
