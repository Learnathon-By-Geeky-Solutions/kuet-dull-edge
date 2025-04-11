import { IMaterialClassroom } from '../../common/interfaces/material.interface'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { MaterialStatus } from '../../common/enums'

@Schema({ timestamps: true })
export class MaterialClassroom extends Document implements IMaterialClassroom {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Classroom', required: true })
  classroomId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  addedBy: Types.ObjectId // User ID who added this to classroom

  @Prop({
    required: true,
    type: String,
    enum: MaterialStatus
  })
  status: MaterialStatus

  @Prop({ type: Date, default: Date.now })
  addedAt: Date
}

export const MaterialClassroomSchema = SchemaFactory.createForClass(MaterialClassroom)
