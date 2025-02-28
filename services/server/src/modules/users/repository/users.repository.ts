import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types, ClientSession } from 'mongoose'
import { GenericRepository } from '../../common/generic.repository'
import { UserAuth } from '../../users/repository/user-auth.schema'
import { UserDetails } from '../../users/repository/user-details.schema'
import { UserPeek } from '../../users/repository/user-peek.schema'
import { AccountStatus } from '../../../interfaces/users.interfaces'
import { UserMFA, MFAType } from './user-mfa.schema'

@Injectable()
export class UserAuthRepository extends GenericRepository<UserAuth> {
  constructor(
    @InjectModel(UserAuth.name)
    private readonly userAuthModel: Model<UserAuth>
  ) {
    super(userAuthModel)
  }

  async findByEmailOrUsername(email: string, username: string, session?: ClientSession): Promise<UserAuth | null> {
    return this.findOne(
      {
        $or: [{ email: email || '' }, { username: username || '' }]
      },
      session
    )
  }

  async updateAccountStatus(
    userId: Types.ObjectId,
    accountStatus: AccountStatus,
    session?: ClientSession
  ): Promise<UserAuth | null> {
    return this.update({ _id: userId }, { accountStatus }, session)
  }

  async createUser(userData: Partial<UserAuth>, session?: ClientSession): Promise<UserAuth | null> {
    return this.create(userData, session)
  }

  async updatePassword(userId: Types.ObjectId, password: string, session?: ClientSession): Promise<UserAuth | null> {
    return this.update({ _id: userId }, { password }, session)
  }
}

@Injectable()
export class UserDetailsRepository extends GenericRepository<UserDetails> {
  constructor(
    @InjectModel(UserDetails.name)
    private readonly userDetailsModel: Model<UserDetails>
  ) {
    super(userDetailsModel)
  }

  async createDetails(
    userId: Types.ObjectId,
    details: Partial<UserDetails>,
    session?: ClientSession
  ): Promise<UserDetails | null> {
    return this.create(
      {
        _id: userId,
        ...details
      },
      session
    )
  }

  async updateDetails(
    userId: Types.ObjectId,
    details: Partial<UserDetails>,
    session?: ClientSession
  ): Promise<UserDetails | null> {
    return this.update({ _id: userId }, details, session)
  }
}

@Injectable()
export class UserPeekRepository extends GenericRepository<UserPeek> {
  constructor(
    @InjectModel(UserPeek.name)
    private readonly userPeekModel: Model<UserPeek>
  ) {
    super(userPeekModel)
  }

  async createPeek(
    userId: Types.ObjectId,
    userData: Partial<UserPeek>,
    session?: ClientSession
  ): Promise<UserPeek | null> {
    return this.create(
      {
        _id: userId,
        ...userData
      },
      session
    )
  }

  async findByUsername(username: string, session?: ClientSession): Promise<UserPeek | null> {
    return this.findOne({ username }, session)
  }

  async updatePeek(
    userId: Types.ObjectId,
    userData: Partial<UserPeek>,
    session?: ClientSession
  ): Promise<UserPeek | null> {
    return this.update({ _id: userId }, userData, session)
  }
}

@Injectable()
export class UserMFARepository extends GenericRepository<UserMFA> {
  constructor(
    @InjectModel(UserMFA.name)
    private readonly userMFAModel: Model<UserMFA>
  ) {
    super(userMFAModel)
  }

  async createMFA(userId: Types.ObjectId, mfaData: Partial<UserMFA>, session?: ClientSession): Promise<UserMFA | null> {
    return this.create(
      {
        _id: new Types.ObjectId(),
        userId,
        ...mfaData
      },
      session
    )
  }

  async findByUserId(userId: Types.ObjectId, session?: ClientSession): Promise<UserMFA | null> {
    return this.findOne({ userId }, session)
  }

  async updateMFA(userId: Types.ObjectId, mfaData: Partial<UserMFA>, session?: ClientSession): Promise<UserMFA | null> {
    return this.update({ userId }, mfaData, session)
  }

  async enableMFA(userId: Types.ObjectId, session?: ClientSession): Promise<UserMFA | null> {
    return this.update({ userId }, { enabled: true }, session)
  }

  async disableMFA(userId: Types.ObjectId, session?: ClientSession): Promise<UserMFA | null> {
    return this.update({ userId }, { enabled: false, type: undefined, secret: undefined, recoveryCodes: [] }, session)
  }

  async updateRecoveryCodes(
    userId: Types.ObjectId,
    recoveryCodes: string[],
    session?: ClientSession
  ): Promise<UserMFA | null> {
    return this.update({ userId }, { recoveryCodes }, session)
  }
  async validateRecoveryCode(userId: Types.ObjectId, code: string, session?: ClientSession): Promise<boolean> {
    const userMfa = await this.findOne({ userId }, session)
    if (!userMfa) return false

    return userMfa.compareRecoveryCode(code)
  }
}
