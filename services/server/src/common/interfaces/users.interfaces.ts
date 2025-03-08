import { Types } from 'mongoose'
import { AccountStatus } from '../enums'

export interface IUserAuth {
  _id: Types.ObjectId
  email: string
  username: string
  password: string
  accountStatus: AccountStatus

  comparePassword(password: string): Promise<boolean>
}

export interface IUserDetails {
  _id: Types.ObjectId
  birthday: Date
  institute: string
  instituteIdentifier: string
}

export interface IUserPeek {
  _id: Types.ObjectId
  username: string
  name: string
  photo?: string
}
