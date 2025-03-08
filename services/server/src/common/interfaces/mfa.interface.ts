import { Document, Types } from 'mongoose'
import { MFAType } from '../enums/mfa-type.enum'

export interface IMfa {
  userId: Types.ObjectId
  type: MFAType
  secret?: string
  enabled: boolean
  recoveryCodes?: string[]
}

export interface IMfaDocument extends IMfa, Document {
  _id: Types.ObjectId
}

export interface IMfaSetupResult {
  secret: string
  uri: string
  mfaId: Types.ObjectId
}

export interface IMfaStatus {
  type: MFAType
  _id: Types.ObjectId
}

export interface IMfaStatusResponse {
  mfaList: IMfaStatus[]
}

export interface IMfaVerification {
  code: number
  mfaId?: Types.ObjectId
}

export interface IMfaEnableResult {
  recoveryCodes: string[]
}

export interface IMfaRecovery {
  code: string
}

export interface ISuccessResponse {
  success: boolean
}
