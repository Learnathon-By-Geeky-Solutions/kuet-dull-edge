import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AccountStatus, UserAuth } from '../../users/schemas/user-auth.schema'
import { v4 } from 'uuid'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserAuth.name) private readonly userAuthModel: Model<UserAuth>,
    private readonly jwtService: JwtService
  ) {}

  async getAnonymousUser() {
    return {
      token: this.jwtService.sign({
        _id: v4(),
        accountStatus: AccountStatus.ANONYMOUS
      })
    }
  }

  async signUporLogin({
    email,
    name,
    photo
  }: {
    email: string
    name: string
    photo: string
  }): Promise<{ token: string }> {
    const user = await this.userAuthModel.findOne({ email })
    if (user) {
      return {
        token: this.jwtService.sign({
          _id: user._id,
          accountStatus: user.accountStatus
        })
      }
    } else {
      return {
        token: this.jwtService.sign({
          _id: null,
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { email, name, photo }
        })
      }
    }
  }
}
