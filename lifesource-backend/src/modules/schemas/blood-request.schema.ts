import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  BloodType,
  RequestStatus,
  UrgencyLevel,
  DonationType,
} from '../../common/enums';

export type BloodRequestDocument = BloodRequest & Document;

@Schema({ timestamps: true })
export class BloodRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  hospitalId: Types.ObjectId; // Assigned hospital

  @Prop({ required: true, enum: BloodType })
  bloodType: BloodType;

  @Prop({ enum: DonationType, default: DonationType.WHOLE_BLOOD })
  donationType: DonationType;

  @Prop({ required: true, min: 1 })
  unitsNeeded: number;

  @Prop({ default: 0 })
  unitsFulfilled: number;

  @Prop({ required: true, enum: UrgencyLevel, default: UrgencyLevel.MEDIUM })
  urgency: UrgencyLevel;

  @Prop({
    required: true,
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Prop()
  patientName: string;

  @Prop()
  patientAge: number;

  @Prop()
  medicalCondition: string;

  @Prop()
  requiredBy: Date; // Deadline

  @Prop()
  notes: string;

  // Location for proximity matching
  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: [Number],
  })
  location: { type: string; coordinates: number[] };

  @Prop()
  city: string;

  @Prop()
  hospitalName: string;

  // Matched donors
  @Prop({
    type: [
      {
        donorId: { type: Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['notified', 'accepted', 'declined', 'donated'],
        },
        notifiedAt: Date,
        respondedAt: Date,
      },
    ],
    default: [],
  })
  matchedDonors: {
    donorId: Types.ObjectId;
    status: string;
    notifiedAt: Date;
    respondedAt: Date;
  }[];

  // Inventory assigned
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'BloodInventory' }],
    default: [],
  })
  assignedInventory: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  redirectedBy: Types.ObjectId; // Super admin redirect

  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  redirectedTo: Types.ObjectId;

  @Prop()
  fulfilledAt: Date;
}

export const BloodRequestSchema = SchemaFactory.createForClass(BloodRequest);
