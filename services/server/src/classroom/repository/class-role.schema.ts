import { Document, Types } from 'mongoose'
import { IRole } from '../../common/interfaces'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@Schema()
export class ClassRole extends Document implements IRole {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true, index: true, ref: 'Classroom' })
  classroomId: Types.ObjectId
  @Prop({ required: true })
  name: string
  @Prop({ required: true })
  permissions: [number, number]
}

export const ClassRoleSchema = SchemaFactory.createForClass(ClassRole)
