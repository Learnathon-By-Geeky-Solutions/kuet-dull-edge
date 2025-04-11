import { IStorageUsage } from '../../common/interfaces/material.interface'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class StorageUsage extends Document implements IStorageUsage {
  @Prop({ required: true, auto: true })
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true })
  availableSize: number
  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId
  @Prop({ enum: ['user', 'classroom'], required: true })
  entityType: 'user' | 'classroom'
  @Prop({ required: true })
  fileCount: number
  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date
  @Prop({ required: true })
  storageLimit: number
  @Prop({ required: true })
  totalStorage: number // in bytes
  @Prop({ type: Date, default: Date.now })
  createdAt: Date
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date
  @Prop({ default: false })
  deleted?: boolean
  @Prop({ default: false })
  isPublic?: boolean
  @Prop({ type: [String], default: [] })
  tags?: string[]
  @Prop({ type: Date, default: Date.now })
  lastModified: Date
}

export const StorageUsageSchema = SchemaFactory.createForClass(StorageUsage)
