import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { UsersModule } from '../users/users.module'
import { config } from '../config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { EmailVerificationSchema } from './repository/email-verification.schema'
import { RefreshTokenSchema } from './repository/refreshToken.schema'
import {
  EmailVerificationRepository,
  RefreshTokenRepository
} from './repository/auth.repository'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    MongooseModule.forFeature([
      { name: 'EmailVerification', schema: EmailVerificationSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema }
    ]),
    JwtModule.register({
      global: true,
      secret: config._.jwt_secret,
      signOptions: { expiresIn: '1d' }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    LocalStrategy,
    EmailVerificationRepository,
    RefreshTokenRepository
  ],
  exports: [JwtModule, EmailVerificationRepository, RefreshTokenRepository, AuthService]
})
export class AuthModule {}
