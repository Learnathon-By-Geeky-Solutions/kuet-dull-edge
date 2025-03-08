import { IMinioURL } from '../interfaces/common.interface'
import { Prop, Schema } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class MinioURL extends Document implements IMinioURL {
  @Prop({ required: true })
  url: string

  @Prop({ required: true, auto: true })
  createdAt: Date
}
