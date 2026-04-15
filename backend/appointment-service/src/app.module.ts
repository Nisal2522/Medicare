import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ??
        process.env.MONGODB_URI ??
        'mongodb://localhost:27017/medismart_appointment',
    ),
    AppointmentsModule,
  ],
})
export class AppModule {}
