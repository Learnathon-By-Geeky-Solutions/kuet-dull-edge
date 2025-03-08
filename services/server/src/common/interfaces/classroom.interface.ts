import { Types } from 'mongoose'

export interface IRole {
  _id: Types.ObjectId
  name: string
  classroomId: Types.ObjectId
  permissions: [number, number] // JS supports 32-bit integers for bitmask operations. This is a 64-bit integer.
}

export interface IClassMember {
  userId: Types.ObjectId
  classroomId: Types.ObjectId
  roles: Types.ObjectId[]
}

export interface IClassroom {
  _id: Types.ObjectId
  classroomName: string
  owner: Types.ObjectId
  title: string
  icon?: string
  public: boolean
  description: string
}

export type IClassroomCreateDto = Omit<IClassroom, '_id' | 'owner'>
