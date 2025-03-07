import { Document, Types } from 'mongoose'
import { AccountStatus } from '../enums/account-status.enum'
import { MFAType } from '../enums/mfa-type.enum'

export interface IUserAuth {
  _id: Types.ObjectId
  email: string
  username: string
  password: string
  accountStatus: AccountStatus

  comparePassword(password: string): Promise<boolean>
}

export interface IUserDetails extends Document {
  _id: Types.ObjectId
  birthday: Date
  institute: string
  instituteIdentifier: string
}

export interface IUserPeek extends Document {
  _id: Types.ObjectId
  username: string
  name: string
  photo?: string
}

export interface IUserMFA extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: MFAType
  enabled: boolean
  secret?: string
}
