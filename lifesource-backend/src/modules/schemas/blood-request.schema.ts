import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  BloodType,
  RequestStatus,
  UrgencyLevel,
  DonationType,
} from '../../common/enums';

export type BloodRequestDocument = BloodRequest & Document;

export enum RequestSource {
  DONOR = 'donor', // donor submitting their own blood request to a hospital
  RECIPIENT = 'recipient', // recipient requesting blood for a patient
}

@Schema({ timestamps: true })
export class BloodRequest {
  @Prop({
    required: true,
    enum: RequestSource,
    default: RequestSource.RECIPIENT,
  })
  requestSource: RequestSource;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital' })
  hospitalId: Types.ObjectId;

  @Prop()
  hospitalName: string;

  @Prop({ required: true, enum: BloodType })
  bloodType: BloodType;

  @Prop({ enum: DonationType, default: DonationType.WHOLE_BLOOD })
  donationType: DonationType;

  @Prop({ min: 1 })
  unitsNeeded: number;

  @Prop({ default: 0 })
  unitsFulfilled: number;

  @Prop({ enum: UrgencyLevel, default: UrgencyLevel.MEDIUM })
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
  requiredBy: Date;

  @Prop()
  notes: string;

  @Prop()
  city: string;

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
