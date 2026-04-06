import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AppointmentRef, AppointmentRefSchema } from '../appointments/appointment.schema';
import { TelecomController } from './telecom.controller';
import { TelecomService } from './telecom.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppointmentRef.name, schema: AppointmentRefSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET')?.trim() ?? 'change-me-secret',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [TelecomController],
  providers: [TelecomService, JwtStrategy],
})
export class TelecomModule {}
