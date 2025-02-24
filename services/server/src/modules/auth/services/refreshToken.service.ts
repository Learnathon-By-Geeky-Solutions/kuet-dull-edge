import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import { RefreshToken } from '../schemas/refreshToken.schema'
import { UserAuth } from '../../users/schemas/user-auth.schema'
import * as bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'
import { config } from '../../config'
@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @InjectModel(UserAuth.name) private readonly userAuthModel: Model<UserAuth>,
    private readonly jwtService: JwtService
  ) {}

  async generateRefreshToken(userId: ObjectId): Promise<string> {
    let token: string
    let attempt = 0
    while (attempt < 5) {
      const session = await this.refreshTokenModel.db.startSession()
      try {
        const rtId = new ObjectId()
        token = this.jwtService.sign(
          { rtId, userId },
          { expiresIn: '30d' } // FIXME: use config
        )
        const refreshToken = new this.refreshTokenModel({
          _id: rtId,
          userId,
          tokenHash: token
        })
        await refreshToken.save()
        break
      } catch (error) {
        session.endSession()
        attempt++
        if (attempt === 5) {
          throw error
        }
      }
    }
    return token
  }

  async validateRefreshToken(
    userId: ObjectId,
    rtId: ObjectId,
    token: string
  ): Promise<boolean> {
    const refreshToken = await this.refreshTokenModel.findOne({
      userId,
      _id: rtId
    }) // FIXME: use config
    if (!refreshToken) return false
    return await refreshToken.compareToken(token)
  }

  async deleteRefreshToken(userId: string, token: string): Promise<void> {
    await this.refreshTokenModel.deleteOne({
      userId,
      tokenHash: await bcrypt.hash(token, 10)
    }) // FIXME: use config
  }

  async deleteRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId })
  }
}
