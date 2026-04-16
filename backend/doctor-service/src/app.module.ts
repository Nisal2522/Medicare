import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsModule } from './doctors/doctors.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/medismart_doctor',
    ),
    DoctorsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
