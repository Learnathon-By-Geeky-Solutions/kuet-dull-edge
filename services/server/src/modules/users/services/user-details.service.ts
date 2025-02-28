import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { UserDetails } from '../repository/user-details.schema'

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectModel(UserDetails.name)
    private readonly userDetailsModel: Model<UserDetails>
  ) {}

  async createUserDetails(userDetails: Partial<UserDetails>): Promise<UserDetails> {
    try {
      const newUserDetails = new this.userDetailsModel(userDetails)
      return await newUserDetails.save()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async findUserDetailsById(userId: Types.ObjectId): Promise<UserDetails> {
    try {
      return await this.userDetailsModel.findById(userId).exec()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }

  async updateUserDetails(userId: Types.ObjectId, userDetails: Partial<UserDetails>): Promise<UserDetails> {
    try {
      return await this.userDetailsModel.findByIdAndUpdate(userId, userDetails, { new: true }).exec()
    } catch (error) {
      throw new InternalServerErrorException('DATABASE_ERROR')
    }
  }
}
