import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { EmailVerification } from '../schemas/email-verification.schema'

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerification>
  ) {}

  async createVerification(userId: string): Promise<string> {
    // Delete any existing verification
    await this.emailVerificationModel.deleteOne({ _id: userId })

    // Generate 6 digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    const emailVerification = new this.emailVerificationModel({
      _id: userId,
      verificationCode: verificationCode
    })

    try {
      await emailVerification.save()
      return verificationCode
    } catch (error) {
      throw new InternalServerErrorException('EMAIL_VERIFICATION_SAVE_ERROR')
    }
  }

  async verifyCode(userId: string, verificationCode: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationModel.findOne({
      _id: userId
    })

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
        await this.emailVerificationModel.deleteOne({ _id: userId })
        throw new BadRequestException('VERIFICATION_TRIES_EXCEEDED')
      }
      return false
    }

    // Clean up after successful verification
    await this.emailVerificationModel.deleteOne({ _id: userId })
    return true
  }

  async canResendEmail(userId: string): Promise<boolean> {
    const emailVerification = await this.emailVerificationModel.findOne({
      _id: userId
    })

    if (emailVerification && emailVerification.createdAt.getTime() + 60000 > Date.now()) {
      throw new BadRequestException('EMAIL_VERIFICATION_RESEND_TOO_SOON')
    }

    return true
  }
}
