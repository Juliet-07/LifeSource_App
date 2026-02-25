import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/dashboard/admin/admin.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { HospitalModule } from './modules/dashboard/hospital/hospital.module';
import { RecipientModule } from './modules/dashboard/recipient/recipient.module';
import { DonorModule } from './modules/dashboard/donor/donor.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        if (!config.MONGO_URI) throw new Error('MONGO_URI is not defined');
        return config;
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (ConfigService: ConfigService) => ({
        uri: ConfigService.get<string>('MONGO_URI'),
        // useNewUrlParser: true,
        // useUnifiedTopoloy: true,
      }),
      inject: [ConfigService],
    }),

    LoggerModule,
    AuthModule,
    AdminModule,
    DonorModule,
    HospitalModule,
    RecipientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
