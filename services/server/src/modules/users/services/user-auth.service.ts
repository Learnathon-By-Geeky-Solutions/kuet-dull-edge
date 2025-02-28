import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { AccountStatus, UserAuth } from '../repository/user-auth.schema'

@Injectable()
export class UserAuthService {
  constructor(@InjectModel(UserAuth.name) private readonly userAuthModel: Model<UserAuth>) {}

  async findByEmailOrUsername(email: string, username: string): Promise<UserAuth | null> {
    try {
      return await this.userAuthModel.findOne({ $or: [{ email }, { username }] })
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async createUserAuth(userAuthData: Partial<UserAuth>): Promise<UserAuth> {
    try {
      const userAuth = new this.userAuthModel(userAuthData)
      return await userAuth.save()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async findById(id: string): Promise<UserAuth | null> {
    try {
      return await this.userAuthModel.findById(id)
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async updateAccountStatus(id: Types.ObjectId, accountStatus: AccountStatus): Promise<void> {
    try {
      await this.userAuthModel.updateOne({ _id: id }, { accountStatus })
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async updateUserAuth(id: Types.ObjectId, updateData: Partial<UserAuth>): Promise<void> {
    try {
      await this.userAuthModel.updateOne({ _id: id }, updateData)
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }
}
