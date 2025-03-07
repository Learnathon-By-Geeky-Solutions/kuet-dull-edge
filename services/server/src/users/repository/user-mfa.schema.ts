import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { IMfaDocument } from '../../common/interfaces/mfa.interface'
import { MFAType } from '../../common/enums/mfa-type.enum'
@Schema({ timestamps: true })
export class UserMFA extends Document implements IMfaDocument {
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  _id: Types.ObjectId
  @Prop({ type: Types.ObjectId, required: true, ref: 'UserAuth' })
  userId: Types.ObjectId

  @Prop({ default: false })
  enabled: boolean

  @Prop({ type: String, enum: MFAType, required: false })
  type: MFAType

  @Prop({ required: false })
  secret?: string

  @Prop({ type: [String], required: false })
  recoveryCodes?: string[]

  compareRecoveryCode: (code: string) => Promise<boolean>
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
    console.log(`Comparing ${code} with ${hashedCode}`)
    if (await bcrypt.compare(code, hashedCode)) {
      return true
    }
  }
  return false
}
