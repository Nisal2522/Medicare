import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { PublicLandingService } from './public-landing.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

type JwtReqUser = { sub: string; email: string; role: string };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly publicLanding: PublicLandingService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Public marketing snapshot (counts + partner names from DB). */
  @Get('public/landing')
  getPublicLanding() {
    return this.publicLanding.getLandingSnapshot();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: JwtReqUser }) {
    return this.authService.getMe(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  patchMe(
    @Req() req: Request & { user: JwtReqUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, dto);
  }
}
