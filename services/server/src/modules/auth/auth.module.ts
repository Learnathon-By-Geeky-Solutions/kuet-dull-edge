import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import { EmailVerificationSchema } from './repository/email-verification.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { config } from '../config'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { RefreshTokenSchema } from './repository/refreshToken.schema'
import { EmailVerificationRepository, RefreshTokenRepository } from './repository/auth.repository'

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
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    LocalStrategy,
    EmailVerificationRepository,
    RefreshTokenRepository
  ],
  controllers: [AuthController],
  exports: [JwtModule]
})
export class AuthModule {}
