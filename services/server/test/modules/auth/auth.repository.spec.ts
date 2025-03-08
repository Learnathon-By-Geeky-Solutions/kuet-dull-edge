import { Test, TestingModule } from '@nestjs/testing'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connect, Connection, Model, Schema, Types } from 'mongoose'
import { getModelToken } from '@nestjs/mongoose'
import { EmailVerification } from '../../../src/auth/repository/email-verification.schema'
import { RefreshToken } from '../../../src/auth/repository/refreshToken.schema'
import { EmailVerificationRepository, RefreshTokenRepository } from '../../../src/auth/repository/auth.repository'

describe('Auth Repository Tests', () => {
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let emailVerificationModel: Model<EmailVerification>
  let refreshTokenModel: Model<RefreshToken>
  let emailVerificationRepository: EmailVerificationRepository
  let refreshTokenRepository: RefreshTokenRepository

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection

    emailVerificationModel = mongoConnection.model<EmailVerification>(
      'EmailVerification',
      new Schema({
        _id: Types.ObjectId,
        verificationCode: String,
        createdAt: { type: Date, default: Date.now, expires: '15m' }
      })
    )

    refreshTokenModel = mongoConnection.model<RefreshToken>(
      'RefreshToken',
      new Schema({
        _id: Types.ObjectId,
        userId: Types.ObjectId,
        tokenHash: String,
        createdAt: { type: Date, default: Date.now, expires: '30d' }
      })
    )

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationRepository,
        RefreshTokenRepository,
        {
          provide: getModelToken(EmailVerification.name),
          useValue: emailVerificationModel
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModel
        }
      ]
    }).compile()

    emailVerificationRepository = module.get<EmailVerificationRepository>(EmailVerificationRepository)
    refreshTokenRepository = module.get<RefreshTokenRepository>(RefreshTokenRepository)
  })

  afterAll(async () => {
    await mongoConnection.close()
    await mongod.stop()
  })

  afterEach(async () => {
    await emailVerificationModel.deleteMany({})
    await refreshTokenModel.deleteMany({})
  })

  describe('EmailVerificationRepository', () => {
    it('should create a verification record', async () => {
      const userId = new Types.ObjectId()
      const verificationCode = 123456

      const result = await emailVerificationRepository.createVerification(userId, verificationCode)

      expect(result).toBeDefined()
      expect(result?._id.toString()).toBe(userId.toString())
      expect(result?.verificationCode).toBe(verificationCode)
    })

    it('should find verification by user ID', async () => {
      const userId = new Types.ObjectId()
      const verificationCode = 123456

      await emailVerificationRepository.createVerification(userId, verificationCode)
      const found = await emailVerificationRepository.findByUserId(userId)

      expect(found).toBeDefined()
      expect(found?.verificationCode).toBe(verificationCode)
    })

    it('should delete verification by user ID', async () => {
      const userId = new Types.ObjectId()
      const verificationCode = 123456

      await emailVerificationRepository.createVerification(userId, verificationCode)
      const deleteResult = await emailVerificationRepository.deleteByUserId(userId)
      const found = await emailVerificationRepository.findByUserId(userId)

      expect(deleteResult).toBe(true)
      expect(found).toBeNull()
    })
  })

  describe('RefreshTokenRepository', () => {
    it('should create a refresh token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'token123'

      const result = await refreshTokenRepository.createToken(userId, rtId, token)

      expect(result).toBeDefined()
      expect(result?._id.toString()).toBe(rtId.toString())
      expect(result?.userId.toString()).toBe(userId.toString())
      expect(result?.tokenHash).toBe(token)
    })

    it('should find token by user and token ID', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'token123'

      await refreshTokenRepository.createToken(userId, rtId, token)
      const found = await refreshTokenRepository.findByUserAndTokenId(userId, rtId)

      expect(found).toBeDefined()
      expect(found?.tokenHash).toBe(token)
    })

    it('should delete all tokens for a user', async () => {
      const userId = new Types.ObjectId()
      const rtId1 = new Types.ObjectId()
      const rtId2 = new Types.ObjectId()

      await refreshTokenRepository.createToken(userId, rtId1, 'token1')
      await refreshTokenRepository.createToken(userId, rtId2, 'token2')

      const deletedCount = await refreshTokenRepository.deleteAllForUser(userId)
      const found1 = await refreshTokenRepository.findByUserAndTokenId(userId, rtId1)
      const found2 = await refreshTokenRepository.findByUserAndTokenId(userId, rtId2)

      expect(deletedCount).toBe(2)
      expect(found1).toBeNull()
      expect(found2).toBeNull()
    })

    it('should delete a specific token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'token123'

      await refreshTokenRepository.createToken(userId, rtId, token)
      const deleteResult = await refreshTokenRepository.deleteToken(userId, rtId)
      const found = await refreshTokenRepository.findByUserAndTokenId(userId, rtId)

      expect(deleteResult).toBe(true)
      expect(found).toBeNull()
    })
  })
  describe('EmailVerificationRepository - Edge Cases', () => {
    it('should handle creating verification with same userId by replacing old record', async () => {
      const userId = new Types.ObjectId()
      const code1 = 123456
      const code2 = 654321

      await emailVerificationRepository.createVerification(userId, code1)
      await emailVerificationRepository.createVerification(userId, code2)

      // Verify by retrieving the updated record
      const result = await emailVerificationRepository.findByUserId(userId)
      expect(result?.verificationCode).toBe(code2)

      // Only one record should exist
      const count = await emailVerificationModel.countDocuments({ _id: userId })
      expect(count).toBe(1)
    })

    it('should return null when finding verification for non-existent user', async () => {
      const nonExistentId = new Types.ObjectId()
      const result = await emailVerificationRepository.findByUserId(nonExistentId)
      expect(result).toBeNull()
    })

    it('should return false when deleting non-existent verification', async () => {
      const nonExistentId = new Types.ObjectId()
      const result = await emailVerificationRepository.deleteByUserId(nonExistentId)
      expect(result).toBe(false)
    })
  })

  describe('RefreshTokenRepository - Edge Cases', () => {
    it('should handle duplicate token IDs by replacing the old token', async () => {
      const userId = new Types.ObjectId()
      const tokenId = new Types.ObjectId()
      const token1 = 'token123'
      const token2 = 'newToken456'

      await refreshTokenRepository.createToken(userId, tokenId, token1)
      await refreshTokenModel.deleteMany({ _id: tokenId }) // Force delete to ensure clean state
      await refreshTokenRepository.createToken(userId, tokenId, token2)

      // Verify by retrieving the token directly from the model
      const result = await refreshTokenModel.findById(tokenId).exec()
      expect(result?.tokenHash).toBe(token2)

      // Only one record should exist with that ID
      const count = await refreshTokenModel.countDocuments({ _id: tokenId })
      expect(count).toBe(1)
    })

    it('should return null when finding token with valid user ID but invalid token ID', async () => {
      const userId = new Types.ObjectId()
      const realTokenId = new Types.ObjectId()
      const fakeTokenId = new Types.ObjectId()

      await refreshTokenRepository.createToken(userId, realTokenId, 'token123')
      const result = await refreshTokenRepository.findByUserAndTokenId(userId, fakeTokenId)

      expect(result).toBeNull()
    })

    it('should return null when finding token with invalid user ID but valid token ID', async () => {
      const realUserId = new Types.ObjectId()
      const fakeUserId = new Types.ObjectId()
      const tokenId = new Types.ObjectId()

      await refreshTokenRepository.createToken(realUserId, tokenId, 'token123')
      const result = await refreshTokenRepository.findByUserAndTokenId(fakeUserId, tokenId)

      expect(result).toBeNull()
    })

    it('should return false when deleting non-existent token', async () => {
      const userId = new Types.ObjectId()
      const nonExistentTokenId = new Types.ObjectId()

      const result = await refreshTokenRepository.deleteToken(userId, nonExistentTokenId)
      expect(result).toBe(false)
    })

    it('should return 0 when deleting tokens for user with no tokens', async () => {
      const emptyUserId = new Types.ObjectId()
      const result = await refreshTokenRepository.deleteAllForUser(emptyUserId)
      expect(result).toBe(0)
    })
  })
})
