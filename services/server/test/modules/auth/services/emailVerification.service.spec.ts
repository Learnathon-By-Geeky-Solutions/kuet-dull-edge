import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { Model, Types, Connection, connect } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { EmailVerificationService } from '../../../../src/modules/auth/services/emailVerification.service'
import {
  EmailVerification,
  EmailVerificationSchema
} from '../../../../src/modules/auth/schemas/email-verification.schema'

describe('EmailVerificationService', () => {
  let service: EmailVerificationService
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let emailVerificationModel: Model<EmailVerification>

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection
    emailVerificationModel = mongoConnection.model<EmailVerification>('EmailVerification', EmailVerificationSchema)
  })

  afterAll(async () => {
    await mongoConnection.dropDatabase()
    await mongoConnection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
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

  afterEach(async () => {
    const collections = mongoConnection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createVerification', () => {
    it('should create a verification code successfully', async () => {
      const userId = new Types.ObjectId().toString()
      const verificationCode = await service.createVerification(userId)

      // Verify code is 6 digits
      expect(verificationCode).toMatch(/^\d{6}$/)

      // Verify record was created in database
      const record = await emailVerificationModel.findById(userId)
      expect(record).toBeDefined()
      expect(record.tries).toBe(0)
    })

    it('should delete existing verification before creating a new one', async () => {
      const userId = new Types.ObjectId().toString()

      // Create initial verification
      await emailVerificationModel.create({
        _id: userId,
        verificationCode: '111111',
        tries: 3
      })

      // Create new verification
      const newCode = await service.createVerification(userId)

      // Check if new record exists and has reset values
      const record = await emailVerificationModel.findById(userId)
      expect(record).toBeDefined()
      expect(record.tries).toBe(0)
      expect(await record.compareVerificationCode('111111')).toBe(false)
    })

    it('should throw InternalServerErrorException on database error', async () => {
      const userId = new Types.ObjectId().toString()

      // Mock save method to throw an error
      jest.spyOn(emailVerificationModel.prototype, 'save').mockImplementation(() => {
        throw new Error('Database error')
      })

      await expect(service.createVerification(userId)).rejects.toThrow(InternalServerErrorException)
      await expect(service.createVerification(userId)).rejects.toThrow('EMAIL_VERIFICATION_SAVE_ERROR')
    })
  })

  describe('verifyCode', () => {
    it('should return true for valid verification code', async () => {
      const userId = new Types.ObjectId().toString()
      const verificationCode = '123456'

      // Create verification document and mock compareVerificationCode method
      const emailVerificationDoc = new emailVerificationModel({
        _id: userId,
        verificationCode: verificationCode
      })

      emailVerificationDoc.compareVerificationCode = jest.fn().mockResolvedValue(true)
      await emailVerificationDoc.save()

      const result = await service.verifyCode(userId, verificationCode)
      expect(result).toBe(true)

      // Verify document was deleted after successful verification
      const count = await emailVerificationModel.countDocuments({ _id: userId })
      expect(count).toBe(0)
    })

    it('should return false and increment tries for invalid code', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification document with mock method
      const emailVerificationDoc = new emailVerificationModel({
        _id: userId,
        verificationCode: '123456',
        tries: 2
      })

      emailVerificationDoc.compareVerificationCode = jest.fn().mockResolvedValue(false)
      await emailVerificationDoc.save()

      const result = await service.verifyCode(userId, '654321')
      expect(result).toBe(false)

      // Check if tries were incremented
      const updatedDoc = await emailVerificationModel.findById(userId)
      expect(updatedDoc.tries).toBe(3)
    })

    it('should throw BadRequestException when verification record does not exist', async () => {
      const userId = new Types.ObjectId().toString()

      await expect(service.verifyCode(userId, '123456')).rejects.toThrow(BadRequestException)
      await expect(service.verifyCode(userId, '123456')).rejects.toThrow('VERIFICATION_INVALID_ID')
    })

    it('should throw exception when tries exceed limit', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification document with tries exceeding limit
      const emailVerificationDoc = new emailVerificationModel({
        _id: userId,
        verificationCode: '123456',
        tries: 11
      })

      emailVerificationDoc.compareVerificationCode = jest.fn().mockResolvedValue(false)
      await emailVerificationDoc.save()

      await expect(service.verifyCode(userId, '123456')).rejects.toThrow(BadRequestException)
      await expect(service.verifyCode(userId, '123456')).rejects.toThrow('VERIFICATION_TRIES_EXCEEDED')

      // Verify document was deleted
      const count = await emailVerificationModel.countDocuments({ _id: userId })
      expect(count).toBe(0)
    })

    it('should throw InternalServerErrorException when save operation fails', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification document with mock method
      const emailVerificationDoc = new emailVerificationModel({
        _id: userId,
        verificationCode: '123456'
      })

      emailVerificationDoc.compareVerificationCode = jest.fn().mockResolvedValue(false)
      await emailVerificationDoc.save()

      // Mock save to throw an error
      jest.spyOn(emailVerificationModel.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Save failed')
      })

      await expect(service.verifyCode(userId, '654321')).rejects.toThrow(InternalServerErrorException)
      await expect(service.verifyCode(userId, '654321')).rejects.toThrow('ERROR')
    })
  })

  describe('canResendEmail', () => {
    it('should return true when no verification exists', async () => {
      const userId = new Types.ObjectId().toString()

      const result = await service.canResendEmail(userId)
      expect(result).toBe(true)
    })

    it('should return true when cooldown period has passed', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification document with creation time in the past
      const pastDate = new Date(Date.now() - 70000) // 70 seconds ago
      await emailVerificationModel.create({
        _id: userId,
        verificationCode: '123456',
        createdAt: pastDate
      })

      const result = await service.canResendEmail(userId)
      expect(result).toBe(true)
    })

    it('should throw BadRequestException when resend attempted too soon', async () => {
      const userId = new Types.ObjectId().toString()

      // Create verification document with recent creation time
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
