import { JwtService } from '@nestjs/jwt'
import { AccountStatus } from '../users/repository/user-auth.schema'
import { v4 } from 'uuid'
import { Types } from 'mongoose'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common'
import * as crypto from 'crypto'

import { RegisterDto } from './dto/register.dto'
import { OAuthOnboardingDto } from './dto/oauth-onboarding.dto'
import { OnboardingDto } from './dto/onboarding.dto'
import { EmailVerificationRepository, RefreshTokenRepository } from './repository/auth.repository'
import { UserAuthRepository, UserDetailsRepository, UserPeekRepository } from '../users/repository/users.repository'
@Injectable()
export class AuthService {
  constructor(
    private readonly userAuthRepository: UserAuthRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly userPeekRepository: UserPeekRepository,
    private readonly userDetailsRepository: UserDetailsRepository
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

  async validateUser(username: string, password: string): Promise<{ token: string; refreshToken: string }> {
    // TODO : MFA
    const user = await this.userAuthRepository.findByEmailOrUsername('', username)
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS')

    if (!(await user.comparePassword(password))) throw new UnauthorizedException('Invalid credentials')

    return {
      token: this.getToken(user._id, user.accountStatus),
      refreshToken: await this.generateRefreshToken(user._id)
    }
  }

  async generateRefreshToken(userId: Types.ObjectId): Promise<string> {
    let token: string
    let attempt = 0

    while (attempt < 5) {
      try {
        token = this.jwtService.sign({ rtId: new Types.ObjectId(), userId }, { expiresIn: '30d' })

        await this.refreshTokenRepository.createToken(userId, token)
        return token
      } catch (error) {
        attempt++
        if (attempt === 5) {
          throw error
        }
      }
    }
  }

  async validateRefreshToken(userId: Types.ObjectId, rtId: Types.ObjectId, token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findByUserAndTokenId(userId, rtId)
    if (!refreshToken) return false
    return await refreshToken.compareToken(token)
  }

  async deleteRefreshToken(userId: Types.ObjectId, rtId: Types.ObjectId, token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findByUserAndTokenId(userId, rtId)
    if (!refreshToken) throw new UnauthorizedException('REFRESH_TOKEN_NOT_FOUND')

    const isValid = await refreshToken.compareToken(token)
    if (!isValid) throw new UnauthorizedException('REFRESH_TOKEN_INVALID')

    await this.refreshTokenRepository.deleteToken(userId, rtId)
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
    const user = await this.userAuthRepository.findByEmailOrUsername(email, '')
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
      refreshToken: await this.generateRefreshToken(user._id)
    }
  }

  async refreshToken(refreshToken: string) {
    const decoded = this.jwtService.decode(refreshToken)
    const { userId, rtId } = decoded
    const user = await this.userAuthRepository.findById(userId)

    if (!user) throw new UnauthorizedException('INVALID_REFRESH_TOKEN')
    if (!(await this.validateRefreshToken(user._id, rtId, refreshToken)))
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN')

    return {
      token: this.getToken(user._id, user.accountStatus)
    }
  }

  async registerLocal({ username, password, email }: RegisterDto): Promise<{ token: string }> {
    const existingUser = await this.userAuthRepository.findByEmailOrUsername(email, username)
    if (existingUser) throw new ConflictException('USER_EXISTS')

    const userAuth = await this.userAuthRepository.createUser({
      email,
      username,
      password,
      accountStatus: AccountStatus.EMAIL_VERIFICATION
    })

    if (!userAuth) {
      throw new InternalServerErrorException('DATABASE')
    }

    // Create email verification
    const verificationCode = await this.createVerification(userAuth._id.toString())

    // Send verification email
    this.sendVerificationEmail(email, verificationCode)

    const token = this.jwtService.sign({
      userId: userAuth._id,
      accountStatus: userAuth.accountStatus
    })

    return { token }
  }

  async createVerification(userId: string): Promise<string> {
    // Delete any existing verification
    await this.emailVerificationRepository.deleteByUserId(userId)

    // Generate 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      await this.emailVerificationRepository.createVerification(userId, verificationCode)
      return verificationCode
    } catch (error) {
      throw new InternalServerErrorException('EMAIL_VERIFICATION_SAVE_ERROR')
    }
  }

  async verifyCode(userId: string, verificationCode: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findByUserId(userId)

    if (!emailVerification) {
      throw new BadRequestException('VERIFICATION_INVALID_ID')
    }

    const isValid = await emailVerification.compareVerificationCode(verificationCode)

    if (!isValid) {
      emailVerification.tries++
      try {
        await emailVerification.save()
      } catch (error) {
        throw new InternalServerErrorException('ERROR')
      }

      if (emailVerification.tries > 10) {
        await this.emailVerificationRepository.deleteByUserId(userId)
        throw new BadRequestException('VERIFICATION_TRIES_EXCEEDED')
      }
      return false
    }

    // Clean up after successful verification
    await this.emailVerificationRepository.deleteByUserId(userId)
    return true
  }

  async canResendEmail(userId: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findByUserId(userId)

    if (emailVerification && emailVerification.createdAt.getTime() + 60000 > Date.now()) {
      throw new BadRequestException('EMAIL_VERIFICATION_RESEND_TOO_SOON')
    }

    return true
  }

  async verifyEmail(_id: string, verificationCode: string): Promise<{ token: string }> {
    // Check if userAuth exists and is in EMAIL_VERIFICATION status
    const userAuth = await this.userAuthRepository.findById(_id)
    if (!userAuth || userAuth.accountStatus !== AccountStatus.EMAIL_VERIFICATION)
      throw new BadRequestException('INVALID_ACCOUNT_STATUS')

    // Verify the code
    const isValid = await this.verifyCode(_id, verificationCode)
    if (!isValid) {
      throw new BadRequestException('VERIFICATION_CODE_INVALID')
    }

    // Update userAuth accountStatus to ONBOARDING
    await this.userAuthRepository.updateAccountStatus(_id, AccountStatus.ONBOARDING)

    return {
      token: this.jwtService.sign({
        userId: _id,
        accountStatus: AccountStatus.ONBOARDING
      })
    }
  }

  async resendVerificationEmail(_id: string): Promise<void> {
    // Check if email can be resent
    await this.canResendEmail(_id)

    // Create new email verification
    const verificationCode = await this.createVerification(_id)

    // Send verification email
    const userAuth = await this.userAuthRepository.findById(_id)
    this.sendVerificationEmail(userAuth.email, verificationCode)
  }

  private sendVerificationEmail(email: string, token: string): void {
    if (process.env.NODE_ENV === 'dev') {
      console.log(`Verification token for ${email}: ${token}`)
    } else {
      // TODO Send email
    }
  }

  async registerOnboarding(userId: string, user: OnboardingDto): Promise<{ token: string }> {
    // validity checked in controller
    const userAuth = await this.userAuthRepository.findById(userId)
    // Check if userAuth's status is ONBOARDING
    if (userAuth.accountStatus !== AccountStatus.ONBOARDING) throw new BadRequestException('INVALID_ACCOUNT_STATUS')

    await this.userPeekRepository.createPeek(userId, {
      username: userAuth.username,
      name: user.name
    })

    await this.userDetailsRepository.createDetails(userId, {
      birthday: new Date(user.birthday),
      institute: user.institute,
      instituteIdentifier: user.instituteIdentifier
    })

    // Update accountStatus to ACTIVE
    await this.userAuthRepository.updateAccountStatus(userId, AccountStatus.ACTIVE)

    return {
      token: this.jwtService.sign({
        userId,
        accountStatus: AccountStatus.ACTIVE
      })
    }
  }

  async registerOnboardingOauth(
    onboardingDto: OAuthOnboardingDto,
    { email, photo }: { email: string; photo: string }
  ): Promise<{ token: string }> {
    const randomStr = crypto.randomBytes(8).toString('hex') // Generates a 16-character random string

    const userAuth = await this.userAuthRepository.createUser({
      username: onboardingDto.username,
      email,
      password: randomStr,
      accountStatus: AccountStatus.ONBOARDING_OAUTH
    })

    const userId = userAuth._id

    await this.userPeekRepository.createPeek(userId, {
      username: onboardingDto.username,
      name: onboardingDto.name,
      photo // FIXME: Copy to minio and save URL
    })

    await this.userDetailsRepository.createDetails(userId, {
      birthday: new Date(onboardingDto.birthday),
      institute: onboardingDto.institute,
      instituteIdentifier: onboardingDto.instituteIdentifier
    })

    await this.userAuthRepository.updateAccountStatus(userId, AccountStatus.ACTIVE)

    return {
      token: this.jwtService.sign({
        userId,
        accountStatus: AccountStatus.ACTIVE
      })
    }
  }
}
