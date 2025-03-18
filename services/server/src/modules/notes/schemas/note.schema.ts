import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

// Define the Note schema as a Mongoose document
@Schema()
export class Note extends Document {
  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  content: string

  @Prop({ default: Date.now })
  createdAt: Date
}

// Create the schema using Mongoose
export const NoteSchema = SchemaFactory.createForClass(Note)
