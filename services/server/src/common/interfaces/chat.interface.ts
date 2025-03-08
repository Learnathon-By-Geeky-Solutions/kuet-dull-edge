import { Types } from 'mongoose'

export interface IChat {
  _id: Types.ObjectId
  userId: Types.ObjectId
  title: string
  description: string
}

export interface IChatMessage {
  _id: Types.ObjectId
  chatId: Types.ObjectId
  sender: string
  message: string
  attachments?: [Types.ObjectId]
  materials?: [Types.ObjectId]
  notes?: [Types.ObjectId]
  classrooms?: [Types.ObjectId]
  createdAt: Date
}
