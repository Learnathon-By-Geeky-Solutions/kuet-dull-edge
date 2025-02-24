import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model, Types } from 'mongoose'
import { RefreshTokenService } from '../../../../src/modules/auth/services/refreshToken.service'
import { RefreshToken, RefreshTokenSchema } from '../../../../src/modules/auth/schemas/refreshToken.schema'
import { UserAuth, UserAuthSchema } from '../../../../src/modules/users/schemas/user-auth.schema'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Connection, connect } from 'mongoose'

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
  })

  describe('deleteRefreshToken', () => {
    it('should delete a specific refresh token', async () => {
      const userId = new Types.ObjectId().toString()
      const token = 'token.to.delete'

      await service.deleteRefreshToken(userId, token)

      const count = await refreshTokenModel.countDocuments({ userId })
      expect(count).toBe(0)
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
  })
})
