import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'
import { GenericRepository } from '../../common/repository/generic.repository'
import { UserAuth } from '../../users/repository/user-auth.schema'
import { UserDetails } from '../../users/repository/user-details.schema'
import { UserPeek } from '../../users/repository/user-peek.schema'
import { AccountStatus } from '../../common/enums'

@Injectable()
export class UserAuthRepository extends GenericRepository<UserAuth> {
  constructor(
    @InjectModel(UserAuth.name)
    private readonly userAuthModel: Model<UserAuth>
  ) {
    super(userAuthModel)
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
    session?: ClientSession
  ): Promise<UserAuth | null> {
    const conditions = []
    if (email) conditions.push({ email })
    if (username) conditions.push({ username })

    if (conditions.length === 0) return null

    return this.findOne({ $or: conditions }, session)
  }

  async updateAccountStatus(
    userId: Types.ObjectId,
    accountStatus: AccountStatus,
    session?: ClientSession
  ): Promise<UserAuth | null> {
    return this.update({ _id: userId }, { accountStatus }, session)
  }

  async createUser(
    userData: Partial<UserAuth>,
    session?: ClientSession
  ): Promise<UserAuth | null> {
    return this.create(userData, session)
  }

  async updatePassword(
    userId: Types.ObjectId,
    password: string,
    session?: ClientSession
  ): Promise<UserAuth | null> {
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

  async findByUsername(
    username: string,
    session?: ClientSession
  ): Promise<UserPeek | null> {
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
