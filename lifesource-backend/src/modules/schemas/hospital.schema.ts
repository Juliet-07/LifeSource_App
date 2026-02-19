import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HospitalStatus } from '../../common/enums';

export type HospitalDocument = Hospital & Document;

@Schema({ timestamps: true })
export class Hospital {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  country: string;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
  })
  location: { type: string; coordinates: number[] };

  @Prop({ required: true, enum: HospitalStatus, default: HospitalStatus.PENDING })
  status: HospitalStatus;

  @Prop({ type: [String], default: [] })
  services: string[];

  @Prop({ default: false })
  hasBloodBank: boolean;

  @Prop()
  licenseNumber: string;

  @Prop()
  accreditationBody: string;

  // Assigned hospital admin user
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  adminUsers: Types.ObjectId[];

  @Prop()
  approvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  rejectedReason: string;

  @Prop()
  operatingHours: string;

  @Prop({ default: 0 })
  totalDonationsProcessed: number;

  @Prop({ default: 0 })
  totalRequestsFulfilled: number;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);