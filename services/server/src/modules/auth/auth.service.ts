import { JwtService } from '@nestjs/jwt'
import { AccountStatus, MFAType } from '../../interfaces/users.interfaces'
import { v4 } from 'uuid'
import { Types, Connection } from 'mongoose'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import * as speakeasy from 'speakeasy'
import * as crypto from 'crypto'

import { LoginDto, RegisterDto, OnboardingDto, OAuthOnboardingDto, EmailVerifyDto } from './auth.dto'
import { EmailVerificationRepository, RefreshTokenRepository } from './repository/auth.repository'
import {
  UserAuthRepository,
  UserDetailsRepository,
  UserPeekRepository,
  UserMFARepository
} from '../users/repository/users.repository'

@Injectable()
export class AuthService {
  constructor(
    private readonly userAuthRepository: UserAuthRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly userPeekRepository: UserPeekRepository,
    private readonly userDetailsRepository: UserDetailsRepository,
    private readonly userMFARepository: UserMFARepository
  ) {}

  /* Authentication */

  getAnonymousToken(): string {
    return this.jwtService.sign(
      {
        _id: null,
        accountStatus: AccountStatus.ANONYMOUS
      },
      { expiresIn: '1d' }
    )
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

    if (!(await user.comparePassword(password))) throw new UnauthorizedException('INVALID_CREDENTIALS')

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
        const rtId = new Types.ObjectId()
        token = this.jwtService.sign({ rtId, userId }, { expiresIn: '30d' })

        await this.refreshTokenRepository.createToken(userId, rtId, token)
        return token
      } catch (error) {
        attempt++
        if (attempt === 5) {
          throw error
        }
      }
    }
    return token
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
    const user = await this.userAuthRepository.findById(userId as Types.ObjectId)

    if (!user) throw new UnauthorizedException('INVALID_REFRESH_TOKEN')

    if (!(await this.validateRefreshToken(user._id, rtId, refreshToken)))
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN')

    return {
      token: this.getToken(user._id, user.accountStatus)
    }
  }
  /* Registration */
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
    const verificationCode = await this.createVerification(userAuth._id)

    // Send verification email
    this.sendVerificationEmail(email, verificationCode)

    const token = this.jwtService.sign({
      registerId: userAuth._id,
      accountStatus: userAuth.accountStatus
    })

    return { token }
  }

  async createVerification(userId: Types.ObjectId): Promise<string> {
    // Delete any existing verification
    await this.emailVerificationRepository.deleteByUserId(userId)

    // Generate 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      await this.emailVerificationRepository.createVerification(userId, verificationCode)
      return verificationCode
    } catch (error) {
      // TODO : Log error
      throw new InternalServerErrorException('EMAIL_VERIFICATION_SAVE_ERROR')
    }
  }

  async verifyCode(userId: Types.ObjectId, verificationCode: string): Promise<boolean> {
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

  async canResendEmail(userId: Types.ObjectId): Promise<boolean> {
    const emailVerification = await this.emailVerificationRepository.findByUserId(userId)

    if (emailVerification && emailVerification.createdAt.getTime() + 60000 > Date.now()) {
      throw new BadRequestException('EMAIL_VERIFICATION_RESEND_TOO_SOON')
    }

    return true
  }

  async verifyEmail({ token, verificationCode }: EmailVerifyDto): Promise<{ token: string }> {
    const _id = this.jwtService.decode(token).registerId
    //check integrity of token
    if (!_id) throw new BadRequestException('INVALID_TOKEN')
    //check account status
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

  async resendVerificationEmail(token: string): Promise<{ success: boolean }> {
    const _id = this.jwtService.decode(token).registerId
    //check integrity of token
    if (!_id) throw new BadRequestException('INVALID_TOKEN')
    //check account status
    const userAuth = await this.userAuthRepository.findById(_id)
    if (!userAuth || userAuth.accountStatus !== AccountStatus.EMAIL_VERIFICATION)
      throw new BadRequestException('INVALID_ACCOUNT_STATUS')
    // Check if email can be resent
    await this.canResendEmail(_id)

    // Create new email verification
    const verificationCode = await this.createVerification(_id)

    // Send verification email
    this.sendVerificationEmail(userAuth.email, verificationCode)
    return { success: true }
  }

  sendVerificationEmail(email: string, token: string): void {
    if (process.env.NODE_ENV === 'dev') {
      console.log(`Verification token for ${email}: ${token}`)
    } else {
      // TODO Send email
    }
  }

  async registerOnboarding(user: OnboardingDto): Promise<{ token: string }> {
    // Check if userAuth exists and is in EMAIL_VERIFICATION status
    const userId = this.jwtService.decode(user.token).userId
    if (!userId) throw new BadRequestException('INVALID_TOKEN')
    const userAuth = await this.userAuthRepository.findById(userId)
    if (!userAuth) throw new BadRequestException('USER_NOT_FOUND')
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

    const userId = userAuth._id as Types.ObjectId

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
  /* MFA */
  // TODO: Controller should use guards to check if account is active
  generateTOTPMFASecret(username: string): { secret: string; uri: string } {
    const base32Secret = speakeasy.generateSecret({ name: 'ScholrFlow', issuer: 'ScholrFlow' })
    const uri = speakeasy.otpauthURL({
      secret: base32Secret.ascii,
      label: `Schlorflow ${username}`, // TODO: use config
      issuer: 'ScholrFlow'
    })
    return {
      secret: base32Secret.base32,
      uri: uri
    }
  }
  verifyTOTPMFAcode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code
    })
  }
  async generateEmailMFASecret(userId: Types.ObjectId): Promise<string> {
    const user = await this.userAuthRepository.findById(userId)
    if (!user) throw new BadRequestException('USER_NOT_FOUND')
    const email = user.email
    const emailVerification = await this.createVerification(userId)
    this.sendVerificationEmail(email, emailVerification)
    return email
  }

  async verifyEmailMFACode(userId: Types.ObjectId, code: string): Promise<boolean> {
    const secret = await this.emailVerificationRepository.findByUserId(userId)
    return secret.compareVerificationCode(code)
  }

  async setupMFA(
    //TODO: check if MFA already enabled of the same type, or allow a limited number of MFA types
    userId: Types.ObjectId,
    type: MFAType,
    secret?: string
  ): Promise<{ secret: string; uri: string; mfaId: Types.ObjectId }> {
    if (type === MFAType.EMAIL) {
      //user email is the secret
      const email = await this.generateEmailMFASecret(userId)
      const working = await this.userMFARepository.createMFA(userId, {
        enabled: false,
        type,
        secret: email
      })
      return { secret: email, uri: '', mfaId: working._id }
    } else if (type === MFAType.TOTP) {
      const { secret, uri } = this.generateTOTPMFASecret((await this.userAuthRepository.findById(userId)).username)
      const working = await this.userMFARepository.createMFA(userId, {
        enabled: false,
        type,
        secret
      })
      return { secret, uri, mfaId: working._id }
    } else {
      throw new BadRequestException('INVALID_MFA_TYPE')
    }
  }

  async verifyAndEnableMFA(userId: string, code: string, mfaId: Types.ObjectId): Promise<{ recoveryCodes: string[] }> {
    const _userId = new Types.ObjectId(userId)
    const userMfa = await this.userMFARepository.findById(mfaId)
    if (!userMfa) throw new BadRequestException('MFA_SETUP_NOT_INITIATED')
    if (userMfa.enabled) throw new BadRequestException('MFA_ALREADY_ENABLED')
    if (userMfa.userId.toString() !== userId.toString()) throw new BadRequestException('MFA_INVALID_USER')
    if (userMfa.type === MFAType.EMAIL) {
      if (!(await this.verifyEmailMFACode(_userId, code))) throw new BadRequestException('INVALID_CODE')
    }
    if (userMfa.type === MFAType.TOTP) {
      if (!this.verifyTOTPMFAcode(userMfa.secret, code)) throw new BadRequestException('INVALID_CODE')
    }
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex').toUpperCase()) // TODO:use config
    await this.userMFARepository.updateRecoveryCodes(_userId, recoveryCodes)
    await this.userMFARepository.enableMFA(mfaId)
    return { recoveryCodes }
  }

  async enableMFA(userId: Types.ObjectId, type: MFAType, secret: string): Promise<{ recoveryCodes: string[] }> {
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex').toUpperCase()) // TODO:use config
    await this.userMFARepository.updateRecoveryCodes(userId, recoveryCodes)
    return { recoveryCodes }
  }

  async verifyMFA(userId: Types.ObjectId, mfaId: Types.ObjectId, code: string): Promise<boolean> {
    const userMfa = await this.userMFARepository.findOne({ _id: mfaId })
    if (!userMfa) throw new BadRequestException('MFA_SETUP_NOT_INITIATED')
    if (!userMfa.enabled) throw new BadRequestException('MFA_NOT_ENABLED')
    if (userMfa.userId.toString() !== userId.toString()) throw new BadRequestException('MFA_INVALID_USER')
    if (userMfa.type === MFAType.EMAIL) {
      return await this.verifyEmailMFACode(userId, code)
    } else if (userMfa.type === MFAType.TOTP) {
      return this.verifyTOTPMFAcode(userMfa.secret, code)
    }
    return false
  }

  async getMFAStatus(userId: Types.ObjectId): Promise<{ type: MFAType; _id: Types.ObjectId }[]> {
    const userMfa = await this.userMFARepository.findAll({ userId })
    if (!userMfa) {
      return []
    }
    return userMfa.filter(mfa => mfa.enabled).map(mfa => ({ type: mfa.type, _id: mfa._id }))
  }

  async disableMFA(userId: Types.ObjectId): Promise<void> {
    await this.userMFARepository.disableMFA(userId)
  }

  async validateRecoveryCode(userId: Types.ObjectId, code: string): Promise<boolean> {
    return this.userMFARepository.validateRecoveryCode(userId, code)
  }
}
