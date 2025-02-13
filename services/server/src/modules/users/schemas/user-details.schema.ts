import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class UserDetails extends Document {
  @Prop({ required: true })
  institute: string

  @Prop({ required: true })
  instituteIdentifier: string

  @Prop()
  aboutUser: string

  @Prop({ required: true })
  birthday: Date
}

export const UserDetailsSchema = SchemaFactory.createForClass(UserDetails)
