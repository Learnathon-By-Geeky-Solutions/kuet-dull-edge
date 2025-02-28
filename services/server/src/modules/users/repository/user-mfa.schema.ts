import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import * as bcrypt from 'bcrypt'

export enum MFAType {
  TOTP = 'totp',
  SMS = 'sms'
}

@Schema({ timestamps: true })
export class UserMFA extends Document {
  @Prop({ default: false })
  enabled: boolean

  @Prop({ enum: MFAType, required: false })
  type?: MFAType

  @Prop({ required: false })
  secret?: string

  @Prop({ type: [String], required: false })
  recoveryCodes?: string[]
}

export const UserMFASchema = SchemaFactory.createForClass(UserMFA)

UserMFASchema.pre('save', async function (next) {
  if (this.isModified('recoveryCodes') && this.recoveryCodes) {
    const saltRounds = parseInt(process.env.RECOVERY_CODE_SALT_ROUNDS, 10) || 10
    this.recoveryCodes = await Promise.all(
      this.recoveryCodes.map(async code => {
        const hash = await bcrypt.hash(code, saltRounds)
        return hash
      })
    )
  }
  next()
})

UserMFASchema.methods.compareRecoveryCode = async function (code: string) {
  for (const hashedCode of this.recoveryCodes) {
    if (await bcrypt.compare(code, hashedCode)) {
      return true
    }
  }
  return false
}
