import { IClassroom } from '../../common/interfaces'

import { Document, Types } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

// TODO : add organization later on
@Schema({ timestamps: true })
export class Classroom extends Document implements IClassroom {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true, ref: 'UserAuth' })
  owner: Types.ObjectId
  @Prop({ required: true, index: true })
  classroomName: string
  @Prop({ required: true })
  public: boolean
  @Prop({ required: true })
  title: string
  @Prop({ required: false })
  icon?: string
  @Prop({ required: true })
  description: string
}

export const ClassroomSchema = SchemaFactory.createForClass(Classroom)
