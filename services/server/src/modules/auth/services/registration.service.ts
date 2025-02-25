import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { AccountStatus } from '../../users/schemas/user-auth.schema'
import { RegisterDto } from '../dto/register.dto'
import { OAuthOnboardingDto } from '../dto/oauth-onboarding.dto'
import { OnboardingDto } from '../dto/onboarding.dto'
import { EmailVerificationService } from './emailVerification.service'
import { UserAuthService } from '../../users/services/user-auth.service'
import { UserPeekService } from '../../users/services/user-peek.service'
import { UserDetailsService } from '../../users/services/user-details.service'
import * as crypto from 'crypto'
import { Types } from 'mongoose'

@Injectable()
export class RegistrationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userAuthService: UserAuthService,
    private readonly userPeekService: UserPeekService,
    private readonly userDetailsService: UserDetailsService
  ) {}

  async registerLocal({ username, password, email }: RegisterDto): Promise<{ token: string }> {
    if (await this.userAuthService.findByEmailOrUsername(email, username)) throw new ConflictException('USER_EXISTS')

    let userAuth
    try {
      userAuth = await this.userAuthService.createUserAuth({
        email,
        username,
        password,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })
    } catch (error) {
      throw new InternalServerErrorException('DATABASE')
    }

    // Create email verification
    const verificationCode = await this.emailVerificationService.createVerification(userAuth._id.toString())

    // Send verification email
    this.sendVerificationEmail(email, verificationCode)

    const token = this.jwtService.sign({
      userId: userAuth._id,
      accountStatus: userAuth.accountStatus
    })
    return { token }
  }

  async verifyEmail(_id: string, verificationCode: string): Promise<{ token: string }> {
    // Check if userAuth exists and is in EMAIL_VERIFICATION status
    const userAuth = await this.userAuthService.findById(_id)
    if (!userAuth || userAuth.accountStatus !== AccountStatus.EMAIL_VERIFICATION)
      throw new BadRequestException('INVALID_ACCOUNT_STATUS')

    // Verify the code
    const isValid = await this.emailVerificationService.verifyCode(_id, verificationCode)
    if (!isValid) {
      throw new BadRequestException('VERIFICATION_CODE_INVALID')
    }

    // Update userAuth accountStatus to ONBOARDING
    await this.userAuthService.updateAccountStatus(_id as any as Types.ObjectId, AccountStatus.ONBOARDING)

    return {
      token: this.jwtService.sign({
        userId: _id,
        accountStatus: AccountStatus.ONBOARDING
      })
    }
  }

  async resendVerificationEmail(_id: string): Promise<void> {
    // Check if email can be resent
    await this.emailVerificationService.canResendEmail(_id)

    // Create new email verification
    const verificationCode = await this.emailVerificationService.createVerification(_id)

    // Send verification email
    const userAuth = await this.userAuthService.findById(_id)
    this.sendVerificationEmail(userAuth.email, verificationCode)
  }

  async registerOnboarding(userId: string, user: OnboardingDto): Promise<{ token: string }> {
    // validity checked in controller
    const userAuth = await this.userAuthService.findById(userId)
    // Check if userAuth's status is ONBOARDING
    if (userAuth.accountStatus !== AccountStatus.ONBOARDING) throw new BadRequestException('INVALID_ACCOUNT_STATUS')

    const userPeek = await this.userPeekService.createUserPeek({
      _id: userId,
      username: userAuth.username,
      name: user.name
    })
    await this.userDetailsService.createUserDetails({
      _id: userId,
      birthday: new Date(user.birthday),
      institute: user.institute,
      instituteIdentifier: user.instituteIdentifier
    })

    // Update accountStatus to ACTIVE
    await this.userAuthService.updateAccountStatus(userId as any as Types.ObjectId, AccountStatus.ACTIVE)
    return {
      token: this.jwtService.sign({
        userId,
        accountStatus: AccountStatus.ACTIVE
      })
    }
  }

  private sendVerificationEmail(email: string, token: string): void {
    if (process.env.NODE_ENV === 'dev') {
      console.log(`Verification token for ${email}: ${token}`)
    } else {
      // TODO Send email
    }
  }

  async registerOnboardingOauth(
    onboardingDto: OAuthOnboardingDto,
    { email, photo }: { email: string; photo: string }
  ): Promise<{ token: string }> {
    const randomStr = crypto.randomBytes(8).toString('hex') // Generates a 16-character random string
    const userAuth = await this.userAuthService.createUserAuth({
      username: onboardingDto.username,
      email,
      password: randomStr,
      accountStatus: AccountStatus.ONBOARDING_OAUTH
    })
    const userId = userAuth._id
    const userPeek = await this.userPeekService.createUserPeek({
      _id: userId,
      username: onboardingDto.username,
      name: onboardingDto.name,
      photo // FIXME: Copy to minio and save URL
    })
    await this.userDetailsService.createUserDetails({
      _id: userId,
      birthday: new Date(onboardingDto.birthday),
      institute: onboardingDto.institute,
      instituteIdentifier: onboardingDto.instituteIdentifier
    })

    await this.userAuthService.updateAccountStatus(userId, AccountStatus.ACTIVE)
    return {
      token: this.jwtService.sign({
        userId,
        accountStatus: AccountStatus.ACTIVE
      })
    }
  }
}
