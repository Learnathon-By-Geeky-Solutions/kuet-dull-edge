import { Types } from 'mongoose'

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

// Schema

export interface IEmailVerification {
  _id: Types.ObjectId
  verificationCode: number
  createdAt: Date
  tries: number
}
