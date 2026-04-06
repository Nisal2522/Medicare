import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsModule } from './records/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ??
        process.env.MONGODB_URI ??
        'mongodb://localhost:27017/healthcare-platform',
    ),
    PatientsModule,
  ],
})
export class AppModule {}
