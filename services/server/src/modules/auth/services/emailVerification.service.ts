// import { InternalServerErrorException } from '@nestjs/common'
// import { InjectModel } from '@nestjs/mongoose'
// import { Types } from 'mongoose'
// import { EmailVerification } from '../schemas/email-verification.schema'
//
// class EmailVerificationService {
//   @InjectModel(EmailVerification.name)
//   async getEmailVerification(
//     userId: string | Types.ObjectId
//   ): Promise<EmailVerification | null> {
//     return this.emailVerificationModel.findOne({ _id: userId }).exec()
//   }
//
//   async createEmailVerification(
//     userId: Types.ObjectId,
//     verificationCode: string
//   ): Promise<EmailVerification> {
//     const emailVerification = new this.emailVerificationModel({
//       _id: userId,
//       verificationCode,
//       tries: 0
//     })
//     try {
//       return await emailVerification.save()
//     } catch ( error ) {
//       throw new InternalServerErrorException('DATABASE')
//     }
//   }
//
//   async updateEmailVerification(
//     userId: string | Types.ObjectId,
//     update: Partial<EmailVerification>
//   ): Promise<void> {
//     await this.emailVerificationModel.updateOne({ _id: userId }, update).exec()
//   }
//
//   async deleteEmailVerification(
//     userId: string | Types.ObjectId
//   ): Promise<void> {
//     await this.emailVerificationModel.deleteOne({ _id: userId }).exec()
//   }
// }
