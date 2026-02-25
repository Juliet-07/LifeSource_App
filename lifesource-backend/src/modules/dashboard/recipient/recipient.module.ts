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
  Notification,
  NotificationSchema,
  User,
  UserSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [RecipientController, RequestsController],
  providers: [RecipientService],
  exports: [RecipientService, MongooseModule],
})
export class RecipientModule {}
