import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model, Types, Connection, connect } from 'mongoose'
import { RefreshTokenService } from '../../../../src/modules/auth/services/refreshToken.service'
import { RefreshToken, RefreshTokenSchema } from '../../../../src/modules/auth/schemas/refreshToken.schema'
import { UserAuth, UserAuthSchema } from '../../../../src/modules/users/schemas/user-auth.schema'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { UnauthorizedException } from '@nestjs/common'

describe('RefreshTokenService', () => {
  let service: RefreshTokenService
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let refreshTokenModel: Model<RefreshToken>
  let userAuthModel: Model<UserAuth>
  let jwtService: JwtService

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection

    refreshTokenModel = mongoConnection.model('RefreshToken', RefreshTokenSchema)
    userAuthModel = mongoConnection.model('UserAuth', UserAuthSchema)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModel
        },
        {
          provide: getModelToken(UserAuth.name),
          useValue: userAuthModel
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed.jwt.token'),
            decode: jest.fn().mockReturnValue({
              rtId: new Types.ObjectId(),
              userId: new Types.ObjectId()
            })
          }
        }
      ]
    }).compile()

    service = module.get<RefreshTokenService>(RefreshTokenService)
    jwtService = module.get<JwtService>(JwtService)
  })

  afterAll(async () => {
    await mongoConnection.dropDatabase()
    await mongoConnection.close()
    await mongod.stop()
  })

  afterEach(async () => {
    const collections = mongoConnection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
    // Clear mocks
    jest.clearAllMocks()
  })

  describe('validateRefreshToken', () => {
    it('should validate existing token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'valid.token'

      const compareTokenMock = jest.fn().mockResolvedValue(true)
      refreshTokenModel.prototype.compareToken = compareTokenMock

      const refreshToken = await refreshTokenModel.create({
        _id: rtId,
        userId,
        tokenHash: token
      })

      await refreshToken.save()

      const isValid = await service.validateRefreshToken(userId, rtId, token)

      expect(isValid).toBe(true)
      expect(refreshToken.compareToken).toHaveBeenCalledWith(token)
    })

    it('should return false if token not found', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()

      const isValid = await service.validateRefreshToken(userId, rtId, 'token')

      expect(isValid).toBe(false)
    })

    it('should return false if token comparison fails', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'invalid.token'

      const compareTokenMock = jest.fn().mockResolvedValue(false)
      refreshTokenModel.prototype.compareToken = compareTokenMock

      await refreshTokenModel.create({
        _id: rtId,
        userId,
        tokenHash: 'hashed_token'
      })

      const isValid = await service.validateRefreshToken(userId, rtId, token)

      expect(isValid).toBe(false)
      expect(compareTokenMock).toHaveBeenCalledWith(token)
    })

    it('should return false if token belongs to a different user', async () => {
      const correctUserId = new Types.ObjectId()
      const wrongUserId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'valid.token'

      const compareTokenMock = jest.fn().mockResolvedValue(true)
      refreshTokenModel.prototype.compareToken = compareTokenMock

      await refreshTokenModel.create({
        _id: rtId,
        userId: correctUserId,
        tokenHash: token
      })

      const isValid = await service.validateRefreshToken(wrongUserId, rtId, token)

      expect(isValid).toBe(false)
    })

    // it('should handle expired tokens', async () => {
    //   // This test assumes there's an expiry field in the schema
    //   const userId = new Types.ObjectId()
    //   const rtId = new Types.ObjectId()
    //   const token = 'expired.token'

    //   const compareTokenMock = jest.fn().mockResolvedValue(true)
    //   refreshTokenModel.prototype.compareToken = compareTokenMock

    //   const pastDate = new Date()
    //   pastDate.setDate(pastDate.getDate() - 31) // Assuming 30 days expiry

    //   await refreshTokenModel.create({
    //     _id: rtId,
    //     userId,
    //     tokenHash: token,
    //     expiresAt: pastDate
    //   })

    //   const isValid = await service.validateRefreshToken(userId, rtId, token)

    //   // This expects the service to check for expiration; modify if that's not implemented
    //   expect(isValid).toBe(false)
    // })
  })

  describe('generateRefreshToken', () => {
    it('should generate a new refresh token', async () => {
      const userId = new Types.ObjectId()

      const token = await service.generateRefreshToken(userId)

      expect(token).toBe('signed.jwt.token')
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          rtId: expect.any(Types.ObjectId)
        }),
        { expiresIn: '30d' }
      )

      const savedToken = await refreshTokenModel.findOne({ userId })
      expect(savedToken).toBeDefined()
      expect(savedToken.userId).toEqual(userId)
    })

    it('should retry up to 5 times on error', async () => {
      const userId = new Types.ObjectId()
      let attempts = 0

      jest.spyOn(refreshTokenModel.prototype, 'save').mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Save failed')
        }
        return Promise.resolve()
      })

      const token = await service.generateRefreshToken(userId)

      expect(token).toBe('signed.jwt.token')
      expect(attempts).toBe(3)
    })

    it('should throw after 5 failed attempts', async () => {
      const userId = new Types.ObjectId()

      jest.spyOn(refreshTokenModel.prototype, 'save').mockRejectedValue(new Error('Save failed'))

      await expect(service.generateRefreshToken(userId)).rejects.toThrow('Save failed')
    })

    // it('should enforce maximum token limit per user if configured', async () => {
    //   // This test assumes there's a maximum token limit per user
    //   const userId = new Types.ObjectId()
    //   const maxTokens = 5 // Assuming a limit of 5 tokens per user
    //   // Create tokens up to the limit
    //   for (let i = 0; i < maxTokens; i++) {
    //     await refreshTokenModel.create({
    //       userId,
    //       tokenHash: `token-${i}`
    //     })
    //   }
    //   const token = await service.generateRefreshToken(userId)
    //   expect(token).toBe('signed.jwt.token')

    //   // Check if the oldest token was removed
    //   const tokensCount = await refreshTokenModel.countDocuments({ userId })
    //   expect(tokensCount).toBeLessThanOrEqual(maxTokens)
    // })

    //   it('should handle custom token expiration time', async () => {
    //     const userId = new Types.ObjectId()
    //     const customExpiry = '60d'

    //     const token = await service.generateRefreshToken(userId, customExpiry)

    //     expect(token).toBe('signed.jwt.token')
    //     expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object), { expiresIn: customExpiry })
    //   })
  })

  describe('deleteRefreshToken', () => {
    it('should delete a specific refresh token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'token.to.delete'

      await refreshTokenModel.create({
        _id: rtId,
        userId,
        tokenHash: token
      })

      await service.deleteRefreshToken(userId, rtId, token)

      const count = await refreshTokenModel.countDocuments({ userId })
      expect(count).toBe(0)
    })

    it('should handle non-existent tokens gracefully', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const nonExistentToken = 'token.that.doesnt.exist'

      await expect(service.deleteRefreshToken(userId, rtId, nonExistentToken)).rejects.toThrow(UnauthorizedException)
    })

    it('should not delete tokens of other users', async () => {
      const userId1 = new Types.ObjectId()
      const userId2 = new Types.ObjectId()
      const rtId1 = new Types.ObjectId()
      const rtId2 = new Types.ObjectId()
      const token = 'shared.token.name'

      await refreshTokenModel.create([
        { _id: rtId1, userId: userId1, tokenHash: token },
        { _id: rtId2, userId: userId2, tokenHash: token }
      ])

      await service.deleteRefreshToken(userId1, rtId1, token)

      const user1TokenCount = await refreshTokenModel.countDocuments({ userId: userId1 })
      const user2TokenCount = await refreshTokenModel.countDocuments({ userId: userId2 })

      expect(user1TokenCount).toBe(0)
      expect(user2TokenCount).toBe(1)
    })
  })

  describe('deleteRefreshTokens', () => {
    it('should delete all refresh tokens for a user', async () => {
      const userId = new Types.ObjectId().toString()

      await refreshTokenModel.create([
        { userId, tokenHash: 'token1' },
        { userId, tokenHash: 'token2' }
      ])

      await service.deleteRefreshTokens(userId)

      const count = await refreshTokenModel.countDocuments({ userId })
      expect(count).toBe(0)
    })

    it('should handle users with no tokens', async () => {
      const userId = new Types.ObjectId().toString()

      await service.deleteRefreshTokens(userId)

      const count = await refreshTokenModel.countDocuments({ userId })
      expect(count).toBe(0)
    })

    it('should not affect other users tokens', async () => {
      const userId1 = new Types.ObjectId().toString()
      const userId2 = new Types.ObjectId().toString()

      await refreshTokenModel.create([
        { userId: userId1, tokenHash: 'token1' },
        { userId: userId2, tokenHash: 'token2' }
      ])

      await service.deleteRefreshTokens(userId1)

      const user1TokenCount = await refreshTokenModel.countDocuments({ userId: userId1 })
      const user2TokenCount = await refreshTokenModel.countDocuments({ userId: userId2 })

      expect(user1TokenCount).toBe(0)
      expect(user2TokenCount).toBe(1)
    })
  })

  describe('rotateRefreshToken', () => {
    // it('should fail if old token is invalid', async () => {
    //   // This test assumes a token rotation feature should be implemented
    //   const userId = new Types.ObjectId()
    //   const oldRtId = new Types.ObjectId()
    //   const invalidToken = 'invalid.token'
    //   const compareTokenMock = jest.fn().mockResolvedValue(false)
    //   refreshTokenModel.prototype.compareToken = compareTokenMock
    //   await refreshTokenModel.create({
    //     _id: oldRtId,
    //     userId,
    //     tokenHash: 'hashed_token'
    //   })
    //   await expect(service.rotateRefreshToken(userId, oldRtId, invalidToken)).rejects.toThrow()
    // })
  })

  // describe('detectTokenReuse', () => {
  //   it('should detect and handle token reuse attempts', async () => {
  //     // This test assumes a token reuse detection feature should be implemented
  //     const userId = new Types.ObjectId()
  //     const rtId = new Types.ObjectId()
  //     const token = 'reused.token'

  //     // Mark the token as already used
  //     await refreshTokenModel.create({
  //       _id: rtId,
  //       userId,
  //       tokenHash: token,
  //       used: true
  //     })

  //     // Detection should trigger when validating an already used token
  //     const isValid = await service.validateRefreshToken(userId, rtId, token)
  //     expect(isValid).toBe(false)

  //     // Service should remove all tokens for this user as a security measure
  //     const tokensCount = await refreshTokenModel.countDocuments({ userId })
  //     expect(tokensCount).toBe(0)
  //   })
  // })
})
