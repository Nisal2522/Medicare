import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LandingPartnerDocument = HydratedDocument<LandingPartner>;

@Schema({ collection: 'landing_partners', timestamps: true })
export class LandingPartner {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: 0 })
  sortOrder!: number;
}

export const LandingPartnerSchema =
  SchemaFactory.createForClass(LandingPartner);
