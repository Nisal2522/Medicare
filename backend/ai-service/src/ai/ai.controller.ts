import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AiService } from './ai.service';
import { AnalyzeSymptomsDto } from './dto/analyze-symptoms.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('analyze-symptoms')
  analyze(
    @Body() dto: AnalyzeSymptomsDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.ai.analyze(req.user, dto);
  }

  @Get('analysis-history')
  listHistory(@Req() req: Request & { user: JwtPayload }) {
    return this.ai.listHistory(req.user);
  }
}
