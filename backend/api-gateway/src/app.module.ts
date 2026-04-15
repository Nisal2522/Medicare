import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingSummaryController } from './booking-summary.controller';
import { BookingSummaryService } from './booking-summary.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 12_000, maxRedirects: 3 }),
  ],
  controllers: [BookingSummaryController],
  providers: [BookingSummaryService],
})
export class AppModule {}

