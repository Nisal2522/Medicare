import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import {
  SymptomAnalysisHistory,
  SymptomAnalysisHistorySchema,
} from './schemas/symptom-analysis-history.schema';

@Module({
  imports: [
    HttpModule.register({ timeout: 120_000, maxRedirects: 3 }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-secret',
    }),
    MongooseModule.forFeature([
      {
        name: SymptomAnalysisHistory.name,
        schema: SymptomAnalysisHistorySchema,
      },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, JwtStrategy],
})
export class AiModule {}
