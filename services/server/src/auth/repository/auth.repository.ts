import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'
import { GenericRepository } from '../../common/repository/generic.repository'
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

  async findByUserId(
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<EmailVerification | null> {
    return this.findOne({ _id: userId }, session)
  }

  async deleteByUserId(
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<boolean> {
    const result = await this.deleteOne({ _id: userId }, session)
    return !!result
  }

  async createVerification(
    userId: Types.ObjectId,
    verificationCode: number,
    session?: ClientSession
  ): Promise<EmailVerification | null> {
    return this.create(
      {
        _id: userId,
        verificationCode
      },
      session
    )
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
    tokenId: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<RefreshToken | null> {
    return this.findOne(
      {
        userId,
        _id: tokenId
      },
      session
    )
  }

  async createToken(
    userId: Types.ObjectId,
    rtId: Types.ObjectId,
    token: string,
    session?: ClientSession
  ): Promise<RefreshToken | null> {
    return this.create(
      {
        _id: rtId,
        userId,
        tokenHash: token
      },
      session
    )
  }

  async deleteAllForUser(
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<number> {
    const result = await this.deleteMany({ userId }, session)
    return result || 0
  }

  async deleteToken(
    userId: Types.ObjectId,
    tokenId: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<boolean> {
    const result = await this.delete(
      {
        userId,
        _id: tokenId
      },
      session
    )
    return !!result
  }
}
