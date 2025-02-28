import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { GenericRepository } from '../../../common/generic.repository'
import { UserAuth, AccountStatus } from '../../users/repository/user-auth.schema'
import { UserDetails } from '../../users/repository/user-details.schema'
import { UserPeek } from '../../users/repository/user-peek.schema'

@Injectable()
export class UserAuthRepository extends GenericRepository<UserAuth> {
  constructor(
    @InjectModel(UserAuth.name)
    private readonly userAuthModel: Model<UserAuth>
  ) {
    super(userAuthModel)
  }

  async findByEmailOrUsername(email: string, username: string): Promise<UserAuth | null> {
    return this.findOne({
      $or: [{ email: email || '' }, { username: username || '' }]
    })
  }

  async updateAccountStatus(userId: Types.ObjectId | string, accountStatus: AccountStatus): Promise<UserAuth | null> {
    return this.update({ _id: userId }, { accountStatus })
  }

  async createUser(userData: Partial<UserAuth>): Promise<UserAuth | null> {
    return this.create(userData)
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

  async createDetails(userId: Types.ObjectId | string, details: Partial<UserDetails>): Promise<UserDetails | null> {
    return this.create({
      _id: userId,
      ...details
    })
  }

  async updateDetails(userId: Types.ObjectId | string, details: Partial<UserDetails>): Promise<UserDetails | null> {
    return this.update({ _id: userId }, details)
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

  async createPeek(userId: Types.ObjectId | string, userData: Partial<UserPeek>): Promise<UserPeek | null> {
    return this.create({
      _id: userId,
      ...userData
    })
  }

  async findByUsername(username: string): Promise<UserPeek | null> {
    return this.findOne({ username })
  }

  async updatePeek(userId: Types.ObjectId | string, userData: Partial<UserPeek>): Promise<UserPeek | null> {
    return this.update({ _id: userId }, userData)
  }
}
