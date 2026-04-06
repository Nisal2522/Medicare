import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../auth/jwt.strategy';
import { TelecomService } from './telecom.service';

@Controller('telecom')
export class TelecomController {
  constructor(private readonly telecomService: TelecomService) {}

  /**
   * channelName = appointment Mongo id (same string used as Agora channel).
   * Secured: JWT must be PATIENT or DOCTOR and must match the appointment.
   */
  @Get('token/:channelName')
  @UseGuards(AuthGuard('jwt'))
  async getToken(
    @Req() req: { user: JwtPayload },
    @Param('channelName') channelName: string,
  ) {
    return this.telecomService.getRtcToken(req.user, channelName);
  }
}
