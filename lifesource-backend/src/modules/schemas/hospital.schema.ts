import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HospitalStatus } from '../../common/enums';

export type HospitalDocument = Hospital & Document;

export enum InstitutionType {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  BLOOD_BANK = 'blood_bank',
  LABORATORY = 'laboratory',
  HEALTH_CENTER = 'health_center',
}

@Schema({ timestamps: true })
export class Hospital {
  // ─── Institution Details ─────────────────────────────────────────────────────
  @Prop({ required: true, enum: InstitutionType })
  institutionType: InstitutionType;

  @Prop({ required: true, trim: true })
  institutionName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  officialEmail: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  licenseRegNo: string;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop()
  zipCode: string;

  @Prop({ required: true })
  country: string;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
  })
  location: { type: string; coordinates: number[] };

  // ─── Contact Person ──────────────────────────────────────────────────────────
  @Prop({ required: true })
  contactFullName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  contactEmail: string; // login email for the hospital admin user

  @Prop({ required: true })
  contactPhone: string;

  @Prop()
  note: string;

  // ─── System Fields ───────────────────────────────────────────────────────────
  @Prop({ required: true, enum: HospitalStatus, default: HospitalStatus.PENDING })
  status: HospitalStatus;

  // The User account created for this hospital's contact person
  @Prop({ type: Types.ObjectId, ref: 'User' })
  adminUserId: Types.ObjectId;

  @Prop()
  approvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  rejectedReason: string;

  @Prop({ default: 0 })
  totalDonationsProcessed: number;

  @Prop({ default: 0 })
  totalRequestsFulfilled: number;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);