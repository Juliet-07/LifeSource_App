import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import {
  BloodRequest,
  BloodRequestSchema,
  Donation,
  DonationSchema,
  Donor,
  DonorSchema,
  Notification,
  NotificationSchema,
  User,
  UserSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Donor.name, schema: DonorSchema },
      { name: Donation.name, schema: DonationSchema },
      { name: User.name, schema: UserSchema },
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [DonorController],
  providers: [DonorService],
  exports: [DonorService, MongooseModule],
})
export class DonorModule {}
