import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HospitalController } from './hospital.controller';
import { HospitalService } from './hospital.service';
import {
  Appointment,
  AppointmentSchema,
  BloodInventory,
  BloodInventorySchema,
  BloodRequest,
  BloodRequestSchema,
  Hospital,
  HospitalSchema,
  Notification,
  NotificationSchema,
} from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: BloodInventory.name, schema: BloodInventorySchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: BloodRequest.name, schema: BloodRequestSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
  exports: [HospitalService, MongooseModule],
})
export class HospitalModule {}
