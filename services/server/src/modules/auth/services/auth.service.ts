import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AccountStatus, UserAuth } from '../../users/schemas/user-auth.schema'
import { v4 } from 'uuid'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { RefreshTokenService } from './refreshToken.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserAuth.name) private readonly userAuthModel: Model<UserAuth>,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService
  ) {}

  async getAnonymousUser() {
    return {
      token: this.jwtService.sign({
        _id: v4(),
        accountStatus: AccountStatus.ANONYMOUS
      })
    }
  }

  getToken(_id: Types.ObjectId, accountStatus: AccountStatus): string {
    return this.jwtService.sign({
      _id,
      accountStatus
    })
  }

  async validateUser(
    username: string,
    password: string
  ): Promise<{ token: string; refreshToken: string }> {
    // TODO : MFA
    const user = await this.userAuthModel
      .findOne({ username })
      .select('+password')
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS')

    if (!(await user.comparePassword(password)))
      throw new UnauthorizedException('Invalid credentials')
    return {
      token: this.getToken(user._id, user.accountStatus),
      refreshToken: await this.refreshTokenService.generateRefreshToken(
        user._id
      )
    }
  }

  async oauthEntry({
    email,
    name,
    photo
  }: {
    email: string
    name: string
    photo: string
  }): Promise<{ token: string; refreshToken: any }> {
    const user = await this.userAuthModel.findOne({ email })
    if (!user)
      return {
        token: this.jwtService.sign({
          _id: null,
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { email, name, photo }
        }),
        refreshToken: null
      }
    return {
      token: this.getToken(user._id, user.accountStatus),
      refreshToken: this.refreshTokenService.generateRefreshToken(user._id)
    }
  }

  async refreshToken(refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken)
    const { userId, rtId } = decoded
    const user = await this.userAuthModel.findById(userId)
    if (!user) throw new UnauthorizedException('INVALID_REFRESH_TOKEN')
    if (
      !(await this.refreshTokenService.validateRefreshToken(
        user._id,
        rtId,
        refreshToken
      ))
    )
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN')

    return {
      token: this.getToken(user._id, user.accountStatus)
    }
  }
  //
}
