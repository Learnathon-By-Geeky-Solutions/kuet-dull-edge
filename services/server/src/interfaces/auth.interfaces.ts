import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator'
import { Document, Types } from 'mongoose'

export interface IEmailVerifyDto {
  verificationCode: string
  token: string
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
  token: string
}

export interface IOAuthOnboardingDto extends IOnboardingDto {
  username: string
}

export interface IMFARecoveryDto {
  code: string
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

// MFA
export interface IMFASetupDto {
  type: string
}

export interface IMFAVerifyDto {
  code: string
  mfaId: string
}

export interface IMFASetupResponseDto {
  secret: string
  uri: string
  mfaId: string
}

export interface IMFAVerifyResponseDto {
  recoveryCodes: string[]
}

export interface IMFAStatusResponseDto {
  mfaList: Array<{
    type: string
    _id: string
  }>
}

export interface IMFARecoveryDto {
  code: string
}
