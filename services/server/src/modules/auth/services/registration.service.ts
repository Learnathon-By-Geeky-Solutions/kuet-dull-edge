import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'

import { AccountStatus, UserAuth } from '../../users/schemas/user-auth.schema'
import { UserPeek } from '../../users/schemas/user-peek.schema'
import { UserDetails } from '../../users/schemas/user-details.schema'
import { EmailVerification } from '../schemas/email-verification.schema'
import { RegisterDto } from '../dto/register.dto'
import { OAuthOnboardingDto } from '../dto/oauth-onboarding.dto'
import { OnboardingDto } from '../dto/onboarding.dto'
import * as crypto from 'crypto'
import { use } from 'passport'

@Injectable()
export class RegistrationService {
  constructor(
    @InjectModel(UserAuth.name) private readonly userAuthModel: Model<UserAuth>,
    @InjectModel(UserPeek.name) private readonly userPeekModel: Model<UserPeek>,
    @InjectModel(UserDetails.name)
    private readonly userDetailsModel: Model<UserDetails>,
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerification>,
    private readonly jwtService: JwtService
  ) {}

  async registerLocal({
    username,
    password,
    email,
    captchaToken
  }: RegisterDto): Promise<{ token: string }> {
    if (await this.userAuthModel.findOne({ $or: [{ email }, { username }] }))
      throw new ConflictException('USER_EXISTS')

    let userAuth
    try {
      userAuth = await this.userAuthModel.create({
        email,
        username,
        password,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })
    } catch (error) {
      throw new InternalServerErrorException('ISE_DATABASE')
    }

    // Check if user has a emailVerification document before creating a new one
    const existingEmailVerification = await this.emailVerificationModel.findOne(
      { _id: userAuth._id }
    )
    if (existingEmailVerification) {
      await existingEmailVerification.deleteOne({ userId: userAuth._id })
    }

    // 6 digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString()
    const emailVerification = new this.emailVerificationModel({
      _id: userAuth._id,
      verificationCode: verificationCode
    })
    try {
      await emailVerification.save()
    } catch (error) {
      throw new InternalServerErrorException('ISE_DATABASE')
    }

    // Send verification email
    this.sendVerificationEmail(email, verificationCode)

    const token = this.jwtService.sign({
      userId: userAuth._id,
      accountStatus: userAuth.accountStatus
    })
    return { token }
  }

  async verifyEmail(
    _id: string,
    verificationCode: string
  ): Promise<{ token: string }> {
    //check if userAuth exists and is in EMAIL_VERIFICATION status
    const userAuth = await this.userAuthModel.findById(_id)
    if (
      !userAuth ||
      userAuth.accountStatus !== AccountStatus.EMAIL_VERIFICATION
    )
      throw new BadRequestException('INVALID_ACCOUNT_STATUS')
    const emailVerification = await this.emailVerificationModel.findOne({
      _id
    })
    //check if emailVerification exists
    if (!emailVerification)
      throw new BadRequestException('VERIFICATION_INVALID_ID')
    //check if verificationCode is valid
    if (!(await emailVerification.compareVerificationCode(verificationCode))) {
      //increment tries
      emailVerification.tries++
      try {
        await emailVerification.save()
      } catch (error) {
        throw new InternalServerErrorException('ISE_ERROR')
      }
      throw new BadRequestException('VERIFICATION_CODE_INVALID')
    }
    //if tries > 10, delete emailVerification and userAuth
    if (emailVerification.tries > 10) {
      try {
        await this.emailVerificationModel.deleteOne({ _id })
      } catch (error) {
        throw new InternalServerErrorException('ISE_ERROR')
      }
      await this.userAuthModel.deleteOne({ _id })
      throw new BadRequestException('VERIFICATION_TRIES_EXCEEDED')
    }
    // Update userAuth accountStatus to ONBOARDING
    await this.userAuthModel.updateOne(
      { _id },
      { accountStatus: AccountStatus.ONBOARDING }
    )
    // Delete emailVerification
    await this.emailVerificationModel.deleteOne({ _id })
    return {
      token: this.jwtService.sign({
        userId: _id,
        accountStatus: AccountStatus.ONBOARDING
      })
    }
  }

  async resendVerificationEmail(_id: string): Promise<void> {
    //check if 1 minute has passed since last email
    const emailVerification = await this.emailVerificationModel.findOne({
      _id
    })
    if (
      emailVerification &&
      emailVerification.createdAt.getTime() + 60000 > Date.now()
    )
      throw new BadRequestException('EMAIL_VERIFICATION_RESEND_TOO_SOON')
    // delete previous emailVerification
    await this.emailVerificationModel.deleteOne({ _id })
    // create new emailVerification
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString()
    const emailVerificationNew = new this.emailVerificationModel({
      _id,
      verificationCode
    })
    try {
      await emailVerificationNew.save()
    } catch (error) {
      throw new InternalServerErrorException('EMAIL_VERIFICATION_SAVE_ERROR')
    }
    // Send verification email
    const userAuth = await this.userAuthModel.findById(_id)
    this.sendVerificationEmail(userAuth.email, verificationCode)
  }

  async registerOnboarding(
    userId: string,
    user: OnboardingDto
  ): Promise<{ token: string }> {
    // validity checked in contoller
    const userAuth = await this.userAuthModel.findById(userId)
    //check if userAuth's status is ONBOARDING
    if (userAuth.accountStatus !== AccountStatus.ONBOARDING)
      throw new BadRequestException('INVALID_ACCOUNT_STATUS')
    const userPeek = new this.userPeekModel({
      _id: userId,
      username: userAuth.username,
      name: user.name
    })
    userPeek.save()
    const userDetails = new this.userDetailsModel({
      _id: userId,
      birthday: user.birthday,
      institute: user.institute,
      instituteIdentifier: user.instituteIdentifier
    })
    userDetails.save()

    //accountStatus to ACTIVE
    await this.userAuthModel.updateOne(
      { _id: userId },
      { accountStatus: AccountStatus.ACTIVE }
    )
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
    { email, name, photo }: { email: string; name: string; photo: string }
  ): Promise<{ token: string }> {
    const randomStr = crypto.randomBytes(8).toString('hex') // Generates a 16-character random string
    const userAuth = new this.userAuthModel({
      username: onboardingDto.username,
      email,
      password: randomStr,
      accountStatus: AccountStatus.ONBOARDING_OAUTH
    })
    await userAuth.save()
    const userId = userAuth._id
    const userPeek = new this.userPeekModel({
      _id: userId,
      username: onboardingDto.username,
      name: onboardingDto.name,
      photo // FIXME: Copy to minio and save URL
    })
    userPeek.save()
    const userDetails = new this.userDetailsModel({
      _id: userId,
      birthday: onboardingDto.birthday,
      institute: onboardingDto.institute,
      instituteIdentifier: onboardingDto.instituteIdentifier
    })
    userDetails.save()

    await this.userAuthModel.updateOne(
      { _id: userId },
      { username: onboardingDto.username, accountStatus: AccountStatus.ACTIVE }
    )
    userAuth.accountStatus = AccountStatus.ACTIVE
    await userAuth.save()
    return {
      token: this.jwtService.sign({
        userId,
        accountStatus: AccountStatus.ACTIVE
      })
    }
  }
}
