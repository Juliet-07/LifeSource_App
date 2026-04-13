import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import {
  Appointment,
  AppointmentSchema,
  BloodRequest,
  BloodRequestSchema,
  Donation,
  DonationSchema,
  Donor,
  DonorSchema,
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
      { name: Appointment.name, schema: AppointmentSchema },
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Donor.name, schema: DonorSchema },
      { name: Donation.name, schema: DonationSchema },
      { name: Hospital.name, schema: HospitalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DonorController],
  providers: [DonorService],
  exports: [DonorService, MongooseModule],
})
export class DonorModule {}
