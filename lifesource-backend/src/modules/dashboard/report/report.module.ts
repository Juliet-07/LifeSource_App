import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './report.controller';
import { ReportsService } from './report.service';
import {
  Appointment,
  AppointmentSchema,
  BloodInventory,
  BloodInventorySchema,
  BloodRequest,
  BloodRequestSchema,
  Donation,
  DonationSchema,
  Donor,
  DonorSchema,
  Hospital,
  HospitalSchema,
  User,
  UserSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Donor.name, schema: DonorSchema },
      { name: Donation.name, schema: DonationSchema },
      { name: Hospital.name, schema: HospitalSchema },
      { name: BloodInventory.name, schema: BloodInventorySchema },
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
