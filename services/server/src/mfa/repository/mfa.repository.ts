import { Injectable } from '@nestjs/common'
import { GenericRepository } from '../../common/repository/generic.repository'
import { UserMFA } from './user-mfa.schema'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'

@Injectable()
export class UserMFARepository extends GenericRepository<UserMFA> {
  constructor(
    @InjectModel(UserMFA.name)
    private readonly userMFAModel: Model<UserMFA>
  ) {
    super(userMFAModel)
  }

  async createMFA(
    userId: Types.ObjectId,
    mfaData: Partial<UserMFA>,
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.create(
      {
        _id: new Types.ObjectId(),
        userId,
        ...mfaData
      },
      session
    )
  }

  async findByUserId(
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.findOne({ userId }, session)
  }

  async updateMFA(
    userId: Types.ObjectId,
    mfaData: Partial<UserMFA>,
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.update({ userId }, mfaData, session)
  }

  async enableMFA(
    mfaId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.update({ _id: mfaId }, { enabled: true }, session)
  }

  async disableMFA(
    userId: Types.ObjectId,
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.update(
      { userId },
      { enabled: false, type: undefined, secret: undefined, recoveryCodes: [] },
      session
    )
  }

  async updateRecoveryCodes(
    userId: Types.ObjectId,
    recoveryCodes: string[],
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.update({ userId }, { recoveryCodes }, session)
  }

  async validateRecoveryCode(
    userId: Types.ObjectId,
    code: string,
    session?: ClientSession
  ): Promise<boolean> {
    const userMfa = await this.findOne({ userId }, session)
    if (!userMfa) return false

    return userMfa.compareRecoveryCode(code)
  }
}
