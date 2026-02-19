import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BloodType, DonationType } from '../../common/enums';

export type DonorDocument = Donor & Document;

@Schema({ timestamps: true })
export class Donor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: BloodType })
  bloodType: BloodType;

  @Prop({ default: true })
  isEligible: boolean;

  @Prop()
  lastDonationDate: Date;

  @Prop()
  nextEligibleDate: Date;

  @Prop({ enum: DonationType })
  preferredDonationType: DonationType;

  @Prop({ default: true })
  isAvailable: boolean; // Donor's self-declared availability

  @Prop({ default: false })
  consentGiven: boolean;

  @Prop({ default: false })
  consentForAnonymousDonation: boolean;

  @Prop({ default: 0 })
  totalDonations: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  // Medical info
  @Prop({ default: false })
  hasChronicIllness: boolean;

  @Prop({ default: false })
  onMedication: boolean;

  @Prop()
  weight: number; // kg, minimum 50kg for donation

  @Prop()
  age: number;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Hospital', default: [] })
  preferredHospitals: Types.ObjectId[];
}

export const DonorSchema = SchemaFactory.createForClass(Donor);