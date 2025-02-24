import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { UserAuth } from '../schemas/user-auth.schema'
import { UserPeek } from '../schemas/user-peek.schema'
import { UserDetails } from '../schemas/user-details.schema'

@Injectable()
export class UserAuthService {
  constructor(
    @InjectModel(UserAuth.name)
    private readonly userAuthModel: Model<UserAuth>,
    @InjectModel(UserPeek.name)
    private readonly userPeekModel: Model<UserPeek>,
    @InjectModel(UserDetails.name)
    private readonly userDetailsModel: Model<UserDetails>
  ) {}

  // --- UserAuth-related functions ---

  async findUserAuthByQuery(
    query: Partial<{ email: string; username: string }>
  ): Promise<UserAuth | null> {
    return this.userAuthModel.findOne(query).exec()
  }

  async findUserAuthByUsername(
    username: string,
    withPassword: boolean = false
  ): Promise<UserAuth | null> {
    const query = this.userAuthModel.findOne({ username })
    if (withPassword) query.select('+password')
    return query.exec()
  }

  async findUserAuthByEmail(email: string): Promise<UserAuth | null> {
    return this.userAuthModel.findOne({ email }).exec()
  }

  async findUserAuthById(
    id: string | Types.ObjectId
  ): Promise<UserAuth | null> {
    return this.userAuthModel.findById(id).exec()
  }

  async createUserAuth(data: Partial<UserAuth>): Promise<UserAuth> {
    try {
      return await this.userAuthModel.create(data)
    } catch (error) {
      throw new InternalServerErrorException('DATABASE')
    }
  }

  async updateUserAuth(
    id: string | Types.ObjectId,
    update: Partial<UserAuth>
  ): Promise<void> {
    await this.userAuthModel.updateOne({ _id: id }, update).exec()
  }

  async deleteUserAuth(id: string | Types.ObjectId): Promise<void> {
    await this.userAuthModel.deleteOne({ _id: id }).exec()
  }

  // --- UserPeek-related function ---

  async createUserPeek(data: {
    _id: string | Types.ObjectId
    username: string
    name: string
    photo?: string
  }): Promise<UserPeek> {
    const userPeek = new this.userPeekModel(data)
    try {
      return await userPeek.save()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE')
    }
  }

  // --- UserDetails-related function ---

  async createUserDetails(data: {
    _id: string | Types.ObjectId
    birthday: Date
    institute: string
    instituteIdentifier: string
  }): Promise<UserDetails> {
    const userDetails = new this.userDetailsModel(data)
    try {
      return await userDetails.save()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE')
    }
  }
}
