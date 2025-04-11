import { IMaterialShare } from '../../common/interfaces/material.interface'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { MaterialStatus } from '../../common/enums'

@Schema({ timestamps: true })
export class MaterialShare extends Document implements IMaterialShare {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Material', required: true })
  materialId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedBy: Types.ObjectId // User ID who shared this

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedWith: Types.ObjectId // User ID who received the share

  @Prop({ enum: MaterialStatus, required: true })
  status: 'active' | 'revoked'

  @Prop({ type: Date, default: Date.now })
  sharedAt: Date
  accessLevel: 'view' | 'edit'
}

export const MaterialSchema = SchemaFactory.createForClass(MaterialShare)
