import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { Model, Types, Connection, connect } from 'mongoose'
import { EmailVerificationService } from '../../../../src/modules/auth/services/emailVerification.service'
import {
  EmailVerificationSchema,
  EmailVerification
} from '../../../../src/modules/auth/repository/email-verification.schema'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { MongoMemoryServer } from 'mongodb-memory-server'

describe('EmailVerificationService', () => {
  let service: EmailVerificationService
  let emailVerificationModel: Model<EmailVerification>
  let mongod: MongoMemoryServer
  let mongoConnection: Connection

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection

    emailVerificationModel = mongoConnection.model(EmailVerification.name, EmailVerificationSchema)
  })

  afterAll(async () => {
    await mongoConnection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
    //await emailVerificationModel.deleteMany({})

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: getModelToken(EmailVerification.name),
          useValue: emailVerificationModel
        }
      ]
    }).compile()

    service = module.get<EmailVerificationService>(EmailVerificationService)
  })

  describe('createVerification', () => {
    it('should create a verification code for a user', async () => {
      const userId = new Types.ObjectId().toString()

      const verificationCode = await service.createVerification(userId)

      expect(verificationCode).toBeDefined()
      expect(verificationCode.length).toBe(6)

      const verification = await emailVerificationModel.findOne({ _id: userId })
      expect(verification).toBeDefined()
    })

    it('should delete existing verification before creating a new one', async () => {
      const userId = new Types.ObjectId().toString()

      // Create initial verification
      await service.createVerification(userId)

      // Create another verification for the same user
      const newCode = await service.createVerification(userId)

      // Should only have one verification for this user
      const count = await emailVerificationModel.countDocuments({ _id: userId })
      expect(count).toBe(1)

      const verification = await emailVerificationModel.findOne({ _id: userId })
      expect(verification).toBeDefined()
    })

    it('should throw InternalServerErrorException when save fails', async () => {
      const userId = new Types.ObjectId().toString()

      jest.spyOn(emailVerificationModel.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'))

      await expect(service.createVerification(userId)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('verifyCode', () => {
    it('should verify a valid code successfully', async () => {
      const userId = new Types.ObjectId().toString()
      const verificationCode = '123456'

      // Create a verification record directly
      await emailVerificationModel.create({
        _id: userId,
        verificationCode,
        tries: 0
      })

      const result = await service.verifyCode(userId, verificationCode)

      expect(result).toBe(true)

      // Verification record should be deleted after successful verification
      const verification = await emailVerificationModel.findOne({ _id: userId })
      expect(verification).toBeNull()
    })

    it('should throw BadRequestException when verification ID is invalid', async () => {
      const userId = new Types.ObjectId().toString()
      const verificationCode = '123456'

      await expect(service.verifyCode(userId, verificationCode)).rejects.toThrow(BadRequestException)
      await expect(service.verifyCode(userId, verificationCode)).rejects.toThrow('VERIFICATION_INVALID_ID')
    })

    it('should increment tries and return false for invalid code', async () => {
      const userId = new Types.ObjectId().toString()
      const correctCode = '123456'
      const wrongCode = '654321'

      // Create a verification record
      await emailVerificationModel.create({
        _id: userId,
        verificationCode: correctCode,
        tries: 0
      })

      const result = await service.verifyCode(userId, wrongCode)

      expect(result).toBe(false)

      // Check tries was incremented
      const verification = await emailVerificationModel.findOne({ _id: userId })
      expect(verification.tries).toBe(1)
    })

    it('should throw BadRequestException when tries exceeded', async () => {
      const userId = new Types.ObjectId().toString()
      const correctCode = '123456'
      const wrongCode = '654321'

      // Create a verification record with tries already at limit
      const verificationU = new emailVerificationModel({
        _id: userId,
        verificationCode: correctCode,
        tries: 10 // Set to 10 so next try exceeds the limit
      })
      await verificationU.save()

      await expect(service.verifyCode(userId, wrongCode)).rejects.toThrow(BadRequestException)

      // Verify record was deleted
      const verification = await emailVerificationModel.findOne({ _id: userId })
      expect(verification).toBeNull()
    })

    it('should throw InternalServerErrorException when save fails after incrementing tries', async () => {
      const userId = new Types.ObjectId().toString()
      const correctCode = '123456'
      const wrongCode = '654321'

      // Create a verification record
      await emailVerificationModel.create({
        _id: userId,
        verificationCode: correctCode,
        tries: 0
      })

      // Add compareVerificationCode method to document instances
      const original = emailVerificationModel.findOne
      jest.spyOn(emailVerificationModel, 'findOne').mockImplementation(async function () {
        const doc = await original.apply(this, arguments)
        if (doc) {
          doc.compareVerificationCode = async (code: string) => doc.verificationCode === code
        }
        return doc
      })

      // Mock save to fail
      jest.spyOn(emailVerificationModel.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'))

      await expect(service.verifyCode(userId, wrongCode)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('canResendEmail', () => {
    it('should allow resending email when no verification exists', async () => {
      const userId = new Types.ObjectId().toString()

      const result = await service.canResendEmail(userId)

      expect(result).toBe(true)
    })

    it('should allow resending email when last verification is older than 1 minute', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification with timestamp more than 1 minute ago
      const oldDate = new Date(Date.now() - 61000) // 61 seconds ago

      await emailVerificationModel.create({
        _id: userId,
        verificationCode: '123456',
        createdAt: oldDate
      })

      const result = await service.canResendEmail(userId)

      expect(result).toBe(true)
    })

    it('should throw BadRequestException when trying to resend too soon', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification with recent timestamp
      const recentDate = new Date(Date.now() - 30000) // 30 seconds ago

      await emailVerificationModel.create({
        _id: userId,
        verificationCode: '123456',
        createdAt: recentDate
      })

      await expect(service.canResendEmail(userId)).rejects.toThrow(BadRequestException)
      await expect(service.canResendEmail(userId)).rejects.toThrow('EMAIL_VERIFICATION_RESEND_TOO_SOON')
    })
  })
})
