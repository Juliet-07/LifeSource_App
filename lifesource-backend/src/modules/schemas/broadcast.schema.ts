import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BroadcastTarget } from '../../common/enums';

export type BroadcastDocument = Broadcast & Document;

@Schema({ timestamps: true })
export class Broadcast {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sentBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: BroadcastTarget })
  target: BroadcastTarget;

  @Prop({ type: [String], default: [] })
  targetBloodTypes: string[]; // Optional blood type filter

  @Prop({ type: [String], default: [] })
  targetCities: string[];

  @Prop({ default: 0 })
  totalRecipients: number;

  @Prop({ default: 0 })
  delivered: number;

  @Prop({ default: 0 })
  failed: number;

  @Prop({ default: false })
  isEmailEnabled: boolean;

  @Prop({ default: true })
  isPushEnabled: boolean;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const BroadcastSchema = SchemaFactory.createForClass(Broadcast);
