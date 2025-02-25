import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { JwtService } from '@nestjs/jwt'
import { RefreshToken } from '../schemas/refreshToken.schema'
import * as bcrypt from 'bcrypt'
@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    private readonly jwtService: JwtService
  ) {}

  async generateRefreshToken(userId: Types.ObjectId): Promise<string> {
    let token: string
    let attempt = 0
    while (attempt < 5) {
      const session = await this.refreshTokenModel.db.startSession()
      try {
        const rtId = new Types.ObjectId()
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

  async validateRefreshToken(userId: Types.ObjectId, rtId: Types.ObjectId, token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenModel.findOne({
      userId,
      _id: rtId
    }) // FIXME: use config
    if (!refreshToken) return false
    return await refreshToken.compareToken(token)
  }

  async deleteRefreshToken(userId: Types.ObjectId, rtId: Types.ObjectId, token: string): Promise<void> {
    //find
    const refreshToken = await this.refreshTokenModel.findOne({
      userId,
      _id: rtId
    })
    if (!refreshToken) throw new UnauthorizedException('REFRESH_TOKEN_NOT_FOUND')
    //compare
    const isValid = await refreshToken.compareToken(token)
    if (!isValid) throw new UnauthorizedException('REFRESH_TOKEN_INVALID')
    //delete
    await refreshToken.deleteOne({
      userId,
      _id: rtId
    })
  }

  async deleteRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenModel.deleteMany({ userId })
  }
}
