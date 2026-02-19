import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BloodType, DonationType } from '../../common/enums';

export type DonationDocument = Donation & Document;

@Schema({ timestamps: true })
export class Donation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  donorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BloodRequest' })
  requestId: Types.ObjectId;

  @Prop({ required: true, enum: BloodType })
  bloodType: BloodType;

  @Prop({ required: true, enum: DonationType, default: DonationType.WHOLE_BLOOD })
  donationType: DonationType;

  @Prop({ required: true }) // in ml
  quantity: number;

  @Prop({ required: true })
  donationDate: Date;

  @Prop()
  notes: string;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy: Types.ObjectId; // Hospital staff who verified

  @Prop({ default: 10 })
  pointsAwarded: number;
}

export const DonationSchema = SchemaFactory.createForClass(Donation);
DonationSchema.index({ donorId: 1, donationDate: -1 });
DonationSchema.index({ hospitalId: 1 });
DonationSchema.index({ bloodType: 1 });
