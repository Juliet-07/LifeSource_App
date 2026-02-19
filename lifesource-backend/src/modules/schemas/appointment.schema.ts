import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus, DonationType } from '../../common/enums';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  donorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BloodRequest' })
  requestId: Types.ObjectId; // If scheduled in response to a request

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ required: true, enum: DonationType, default: DonationType.WHOLE_BLOOD })
  donationType: DonationType;

  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Prop()
  notes: string;

  @Prop()
  confirmedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  confirmedBy: Types.ObjectId;

  @Prop()
  cancelReason: string;

  @Prop()
  rescheduledTo: Date;

  @Prop({ type: Types.ObjectId, ref: 'Donation' })
  donationRecord: Types.ObjectId; // Created after completion

  @Prop({ default: false })
  reminderSent: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
