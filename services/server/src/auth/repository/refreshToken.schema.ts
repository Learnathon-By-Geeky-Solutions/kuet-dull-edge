import { Document, Types } from 'mongoose'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { IRefreshToken } from '../../common/interfaces'

@Schema({ timestamps: true })
export class RefreshToken extends Document implements IRefreshToken {
  @Prop({ required: true, type: Types.ObjectId, auto: true })
  _id: Types.ObjectId
  @Prop({ required: true, ref: 'UserAuth', type: Types.ObjectId })
  userId: Types.ObjectId

  @Prop({ required: true, index: true })
  tokenHash: string

  @Prop({ required: true, default: Date.now, expires: 60 * 60 * 24 * 30 }) // FIXME: use config
  createdAt: Date

  compareToken: (token: string) => Promise<boolean>
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken)
RefreshTokenSchema.pre('save', async function (next) {
  if (this.isModified('tokenHash')) {
    const saltRounds = 10
    this.tokenHash = await bcrypt.hash(this.tokenHash, saltRounds)
  }
  next()
})

RefreshTokenSchema.methods.compareToken = async function (
  token: string
): Promise<boolean> {
  return await bcrypt.compare(token, this.tokenHash)
}
