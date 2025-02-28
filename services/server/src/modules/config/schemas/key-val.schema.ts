import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { IKeyVal } from '../../../interfaces/config.interfaces'

@Schema({ timestamps: true })
export class KeyVal extends Document implements IKeyVal {
  @Prop({ required: true })
  key: string

  @Prop({ required: true })
  value: string
}

export const KeyValSchema = SchemaFactory.createForClass(KeyVal)
