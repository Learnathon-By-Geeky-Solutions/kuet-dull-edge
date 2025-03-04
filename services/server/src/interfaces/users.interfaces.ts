import { Exclude } from 'class-transformer'
import { Document, Types } from 'mongoose'

export enum AccountStatus {
  ANONYMOUS = 'ANONYMOUS',
  MFA_REQUIRED = 'MFA_REQUIRED',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  ONBOARDING = 'ONBOARDING',
  ONBOARDING_OAUTH = 'ONBOARDING_OAUTH',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  BANNED = 'BANNED',
  TEMPBAN = 'TEMPBAN',
  SOFT_DELETED = 'SOFT_DELETED'
}

export enum MFAType {
  TOTP = 'totp',
  EMAIL = 'email'
}

// Schema Interfaces
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
