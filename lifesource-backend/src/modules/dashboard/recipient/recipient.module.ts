import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RecipientController,
  RequestsController,
} from './recipient.controller';
import { RecipientService } from './recipient.service';
import {
  BloodRequest,
  BloodRequestSchema,
  Hospital,
  HospitalSchema,
  Notification,
  NotificationSchema,
  User,
  UserSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Hospital.name, schema: HospitalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RecipientController, RequestsController],
  providers: [RecipientService],
  exports: [RecipientService, MongooseModule],
})
export class RecipientModule {}
