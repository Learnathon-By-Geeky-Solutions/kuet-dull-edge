import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { IUserDetails } from '../../../interfaces/users.interfaces'

@Schema({ timestamps: true })
export class UserDetails extends Document implements IUserDetails {
  @Prop({ required: true, type: Types.ObjectId })
  _id: Types.ObjectId

  @Prop({ required: true })
  birthday: Date

  @Prop({ required: true })
  institute: string

  @Prop({ required: true })
  instituteIdentifier: string
}

export const UserDetailsSchema = SchemaFactory.createForClass(UserDetails)
