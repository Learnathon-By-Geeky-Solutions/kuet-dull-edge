import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

export type KeyValDocument = KeyVal & Document

@Schema({ timestamps: true })
export class KeyVal {
  @Prop({ required: true, unique: true })
  key: string

  @Prop({ required: true })
  value: string
}

export const KeyValSchema = SchemaFactory.createForClass(KeyVal)
