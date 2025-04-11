import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { IEmailVerification } from '../../common/interfaces'
import * as bcrypt from 'bcrypt'

@Schema({ timestamps: true })
export class EmailVerification extends Document implements IEmailVerification {
  @Prop({ auto: true })
  _id: Types.ObjectId
  @Prop({ required: true })
  verificationCode: string

  @Prop({ default: Date.now, expires: 180 })
  createdAt: Date

  @Prop({ default: 0 })
  tries: number

  compareVerificationCode: (verificationCode: number) => Promise<boolean>
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification)

EmailVerificationSchema.pre('save', async function (next) {
  if (this.isModified('verificationCode')) {
    const salt = await bcrypt.genSalt(10)
    this.verificationCode = await bcrypt.hash(this.verificationCode, salt)
  }
  next()
})

EmailVerificationSchema.methods.compareVerificationCode = async function (
  verificationCode: string
): Promise<boolean> {
  return await bcrypt.compare(verificationCode, this.verificationCode)
}
