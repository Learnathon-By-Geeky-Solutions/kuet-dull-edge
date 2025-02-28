import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { config } from '../../config'

export enum AccountStatus {
  ANONYMOUS = 'anonymous',
  ACTIVE = 'active',
  EMAIL_VERIFICATION = 'email_verification',
  MANUAL_VERIFICATION = 'manual_verification',
  ONBOARDING = 'onboarding',
  ONBOARDING_OAUTH = 'onboarding_oauth',
  PASSWORD_RESET = 'password_reset',
  TEMP_BAN = 'tempban',
  BANNED = 'banned'
}

@Schema({ timestamps: true })
export class UserAuth extends Document {
  _id: Types.ObjectId
  @Prop({ required: true, unique: true, index: true })
  email: string

  @Prop({ required: true, unique: true, index: true, immutable: true })
  username: string

  @Prop({ required: true, select: false })
  password: string

  @Prop({ type: String, required: false })
  refreshToken: string

  comparePassword: (candidatePassword: string) => Promise<boolean>
  /*
     * Shared userid will be used to link all the user related data,
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserMFA' })
    mfa: MongooseSchema.Types.ObjectId;
    */

  @Prop({ type: String, enum: AccountStatus, default: AccountStatus.ACTIVE })
  accountStatus: AccountStatus
}

export const UserAuthSchema = SchemaFactory.createForClass(UserAuth)
// Pre-save hook to hash the password
UserAuthSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  try {
    const saltRounds = config._.salt_rounds
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (err) {
    next(err)
  }
})

// Method to compare passwords
UserAuthSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}
