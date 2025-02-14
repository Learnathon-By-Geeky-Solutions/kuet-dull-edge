import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './services/auth.service'
import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { RegistrationService } from './services/registration.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtModule } from '@nestjs/jwt'
import { UserPeekSchema } from '../users/schemas/user-peek.schema'
import { UserDetailsSchema } from '../users/schemas/user-details.schema'
import { EmailVerificationSchema } from './schemas/email-verification.schema'
import { UserAuthSchema } from '../users/schemas/user-auth.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { config } from '../config'
import { GoogleStrategy } from './strategies/google.strategy'
import { GitHubStrategy } from './strategies/github.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    MongooseModule.forFeature([
      { name: 'UserPeek', schema: UserPeekSchema },
      { name: 'UserDetails', schema: UserDetailsSchema },
      { name: 'EmailVerification', schema: EmailVerificationSchema },
      { name: 'UserAuth', schema: UserAuthSchema }
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
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    LocalStrategy
  ],
  controllers: [AuthController],
  exports: [JwtModule]
})
export class AuthModule {}
