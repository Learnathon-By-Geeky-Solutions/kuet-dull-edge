import { Types } from 'mongoose'
import { IUserDetails } from './users.interfaces'

export interface IToken {
  token: string
}

export interface ILogin {
  username: string
  password: string
}

export interface IRegister {
  username: string
  password: string
  email: string
}

export interface IUsernameCheck {
  username: string
}

export interface IOnboarding extends IToken, Omit<IUserDetails, '_id'> {}

export interface IOauthOnboarding extends IOnboarding, IUsernameCheck {}

export interface IEmailVerify {
  token: string
  verificationCode: number
}

// Schema

export interface IEmailVerification {
  _id: Types.ObjectId
  verificationCode: number
  createdAt: Date
  tries: number
}

export interface IRefreshToken {
  _id: Types.ObjectId
  userId: Types.ObjectId
  tokenHash: string
  createdAt: Date
  compareToken: (token: string) => Promise<boolean>
}
