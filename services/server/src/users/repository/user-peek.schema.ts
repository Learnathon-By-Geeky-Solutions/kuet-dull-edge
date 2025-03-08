import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { IUserPeek } from 'src/common/interfaces'

@Schema({ timestamps: true })
export class UserPeek extends Document implements IUserPeek {
  @Prop({ required: true, type: Types.ObjectId, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true })
  name: string

  @Prop()
  photo?: string // S3 link

  @Prop({ required: true, unique: true, index: true })
  username: string
}

export const UserPeekSchema = SchemaFactory.createForClass(UserPeek)

// Indexes
UserPeekSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
)
