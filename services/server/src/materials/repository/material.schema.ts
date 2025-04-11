import { IMaterial } from '../../common/interfaces/material.interface'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { MaterialOwner } from '../../common/enums'

@Schema({ timestamps: true })
export class Material extends Document implements IMaterial {
  @Prop({ required: true, auto: true })
  _id: Types.ObjectId

  @Prop({ required: true })
  name: string

  @Prop()
  description?: string

  @Prop({ required: true })
  fileType: string

  @Prop({ required: true })
  fileSize: number // in bytes

  @Prop({ required: true })
  filePath: string // S3 path

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploaderId: Types.ObjectId // Always a user ID who uploaded the file

  @Prop({ type: Types.ObjectId, refPath: 'ownerType', required: true })
  ownerId: Types.ObjectId // User or classroom that owns the material

  @Prop({ enum: MaterialOwner, required: true, type: String })
  ownerType: MaterialOwner // Type of owner

  @Prop({ type: Types.ObjectId, ref: 'Classroom' })
  classOwnerId?: Types.ObjectId // Classroom ID if owner is a classroom

  @Prop({ default: false })
  deleted?: boolean

  @Prop({ default: false })
  isPublic?: boolean

  @Prop({ type: [String], default: [] })
  tags?: string[]

  @Prop({ type: Date, default: Date.now })
  lastModified: Date
  @Prop({ type: Date, default: Date.now })
  createdAt: Date
}

export const MaterialSchema = SchemaFactory.createForClass(Material)
