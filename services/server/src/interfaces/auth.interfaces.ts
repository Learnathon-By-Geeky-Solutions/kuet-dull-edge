import { Document, Types } from 'mongoose'

// DTO Interfaces
export interface IRegisterDto {
  username: string
  email: string
  password: string
}

export interface ILoginDto {
  username: string
  password: string
}

export interface IOnboardingDto {
  name: string
  birthday: string
  institute: string
  instituteIdentifier: string
}

export interface IOAuthOnboardingDto extends IOnboardingDto {
  username: string
}

export interface IEmailVerifyDto {
  verificationCode: string
}

export interface ITokenResponseDto {
  token: string
}

// Schema Interfaces
export interface IEmailVerification extends Document {
  verificationCode: string
  createdAt: Date
  tries: number
  compareVerificationCode(verificationCode: string): Promise<boolean>
}

export interface IRefreshToken extends Document {
  userId: Types.ObjectId
  tokenHash: string
  createdAt: Date
  compareToken(token: string): Promise<boolean>
}
