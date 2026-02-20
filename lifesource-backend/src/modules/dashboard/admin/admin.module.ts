import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  Hospital,
  HospitalSchema,
  BloodInventory,
  BloodInventorySchema,
  BloodRequest,
  BloodRequestSchema,
  Donation,
  DonationSchema,
  User,
  UserSchema,
  Broadcast,
  BroadcastSchema,
  Notification,
  NotificationSchema,
  Donor,
  DonorSchema,
} from '../../schemas';
import { MailModule } from 'src/common/utils/email.module';

@Module({
  imports: [
    EventEmitterModule,
    MailModule,
    MongooseModule.forFeature([
      { name: BloodInventory.name, schema: BloodInventorySchema },
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Broadcast.name, schema: BroadcastSchema },
      { name: Donation.name, schema: DonationSchema },
      { name: Donor.name, schema: DonorSchema },
      { name: Hospital.name, schema: HospitalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
