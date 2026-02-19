import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BloodType, DonationType, InventoryStatus } from '../../common/enums';

export type BloodInventoryDocument = BloodInventory & Document;

@Schema({ timestamps: true })
export class BloodInventory {
  @Prop({ type: Types.ObjectId, ref: 'Hospital', required: true })
  hospitalId: Types.ObjectId;

  @Prop({ required: true, enum: BloodType })
  bloodType: BloodType;

  @Prop({ required: true, enum: DonationType, default: DonationType.WHOLE_BLOOD })
  donationType: DonationType;

  @Prop({ required: true, min: 0 })
  units: number;

  @Prop({ required: true, enum: InventoryStatus, default: InventoryStatus.AVAILABLE })
  status: InventoryStatus;

  @Prop({ required: true })
  collectionDate: Date;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop()
  donorId: Types.ObjectId; // Optional link to donor

  @Prop()
  batchNumber: string;

  @Prop()
  storageLocation: string; // e.g., "Refrigerator B, Shelf 2"

  @Prop()
  notes: string;

  @Prop()
  usedAt: Date;

  @Prop()
  discardedAt: Date;

  @Prop()
  discardReason: string;

  @Prop({ type: Types.ObjectId, ref: 'BloodRequest' })
  usedForRequest: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  addedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const BloodInventorySchema = SchemaFactory.createForClass(BloodInventory);
