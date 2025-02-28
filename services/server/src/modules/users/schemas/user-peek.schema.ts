import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { IUserPeek } from '../../../interfaces/users.interfaces'

@Schema({ timestamps: true })
export class UserPeek extends Document implements IUserPeek {
  @Prop({ required: true, type: Types.ObjectId })
  _id: Types.ObjectId

  @Prop({ required: true })
  username: string

  @Prop({ required: true })
  name: string

  @Prop()
  photo?: string
}

export const UserPeekSchema = SchemaFactory.createForClass(UserPeek)
