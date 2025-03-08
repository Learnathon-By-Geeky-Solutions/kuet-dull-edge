import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import * as bcrypt from 'bcrypt'
import { IUserAuth } from '../../common/interfaces'
import { AccountStatus } from '../../common/enums'

@Schema({ timestamps: true })
export class UserAuth extends Document implements IUserAuth {
  _id: Types.ObjectId
  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true, unique: true })
  username: string

  @Prop({ required: true })
  password: string

  @Prop({
    required: true,
    type: String,
    enum: AccountStatus,
    default: AccountStatus.EMAIL_VERIFICATION
  })
  accountStatus: AccountStatus

  comparePassword: (password: string) => Promise<boolean>
}

export const UserAuthSchema = SchemaFactory.createForClass(UserAuth)

UserAuthSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  next()
})

UserAuthSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password)
}
