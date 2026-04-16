import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { TelecomModule } from './telecom/telecom.module';
import { HealthController } from './health.controller';

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, '').trim();
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: [join(process.cwd(), '.env'), join(__dirname, '..', '.env')],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const raw =
          cfg.get<string>('MONGO_URI')?.trim() ||
          cfg.get<string>('MONGODB_URI')?.trim() ||
          'mongodb://localhost:27017/medismart_telemedicine';
        return { uri: stripQuotes(raw) };
      },
    }),
    TelecomModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
