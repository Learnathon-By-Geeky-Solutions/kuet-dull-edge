import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { UserPeek } from '../repository/user-peek.schema'

// filepath: /home/zihad/Projects/kuet

@Injectable()
export class UserPeekService {
  constructor(@InjectModel(UserPeek.name) private readonly userPeekModel: Model<UserPeek>) {}

  async createUserPeek(userPeekData: Partial<UserPeek>): Promise<UserPeek> {
    try {
      const userPeek = new this.userPeekModel(userPeekData)
      return await userPeek.save()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async findByUsername(username: string): Promise<UserPeek | null> {
    return this.userPeekModel.findOne({ username }).exec()
  }

  async updateUserPeek(userId: Types.ObjectId, updateData: Partial<UserPeek>): Promise<UserPeek> {
    //check if user exists
    const user = await this.userPeekModel.findById(userId).exec()
    if (!user) {
      throw new InternalServerErrorException('USER_NOT_FOUND')
    }
    return this.userPeekModel.findByIdAndUpdate(userId, updateData, { new: true }).exec()
  }
}
