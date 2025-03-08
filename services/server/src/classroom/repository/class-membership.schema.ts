import { Document, Types } from 'mongoose'
import { IClassMember } from '../../common/interfaces'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

@Schema()
export class ClassMemberShip extends Document implements IClassMember {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true, index: true, ref: 'UserAuth' })
  userId: Types.ObjectId
  @Prop({ required: true, index: true, ref: 'Classroom' })
  classroomId: Types.ObjectId

  @Prop({ required: true, type: [{ type: Types.ObjectId, ref: 'Role' }] })
  roles: Types.ObjectId[]
}

export const ClassMemberShipSchema = SchemaFactory.createForClass(ClassMemberShip)
