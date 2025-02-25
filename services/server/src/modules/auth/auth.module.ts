import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './services/auth.service'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { RegistrationService } from './services/registration.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import { EmailVerificationSchema } from './schemas/email-verification.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { config } from '../config'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { RefreshTokenService } from './services/refreshToken.service'
import { RefreshTokenSchema } from './schemas/refreshToken.schema'
import { EmailVerificationService } from './services/emailVerification.service'

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
    RegistrationService,
    RefreshTokenService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    LocalStrategy,
    EmailVerificationService,
    RefreshTokenService
  ],
  controllers: [AuthController],
  exports: [JwtModule]
})
export class AuthModule {}
