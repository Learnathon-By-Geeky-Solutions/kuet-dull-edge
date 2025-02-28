import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { IRouteRateLimit } from '../../../interfaces/config.interfaces'

@Schema({ timestamps: true })
export class RouteRateLimit extends Document implements IRouteRateLimit {
  @Prop({ required: true })
  route: string

  @Prop({ required: true })
  windowMs: number

  @Prop({ required: true })
  max: number

  @Prop()
  message?: string
}

export const RouteRateLimitSchema = SchemaFactory.createForClass(RouteRateLimit)
