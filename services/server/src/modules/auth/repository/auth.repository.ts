import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { GenericRepository } from '../../../common/generic.repository'
import { EmailVerification } from './email-verification.schema'
import { RefreshToken } from './refreshToken.schema'

@Injectable()
export class EmailVerificationRepository extends GenericRepository<EmailVerification> {
  constructor(
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerification>
  ) {
    super(emailVerificationModel)
  }

  async findByUserId(userId: string): Promise<EmailVerification | null> {
    return this.findOne({ _id: userId })
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.delete({ _id: userId })
    return !!result
  }

  async createVerification(userId: string, verificationCode: string): Promise<EmailVerification | null> {
    return this.create({
      _id: userId,
      verificationCode
    })
  }
}

@Injectable()
export class RefreshTokenRepository extends GenericRepository<RefreshToken> {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>
  ) {
    super(refreshTokenModel)
  }

  async findByUserAndTokenId(
    userId: Types.ObjectId | string,
    tokenId: Types.ObjectId | string
  ): Promise<RefreshToken | null> {
    return this.findOne({
      userId,
      _id: tokenId
    })
  }

  async createToken(userId: Types.ObjectId | string, token: string): Promise<RefreshToken | null> {
    const rtId = new Types.ObjectId()
    return this.create({
      _id: rtId,
      userId,
      tokenHash: token
    })
  }

  async deleteAllForUser(userId: Types.ObjectId | string): Promise<number> {
    const result = await this.deleteMany({ userId })
    return result || 0
  }

  async deleteToken(userId: Types.ObjectId | string, tokenId: Types.ObjectId | string): Promise<boolean> {
    const result = await this.delete({
      userId,
      _id: tokenId
    })
    return !!result
  }
}
