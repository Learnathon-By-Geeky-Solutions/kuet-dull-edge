import { Model, Types, Connection, connect } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import * as bcrypt from 'bcrypt'
import { RefreshToken, RefreshTokenSchema } from '../../../src/modules/auth/repository/refreshToken.schema'
import {
  EmailVerification,
  EmailVerificationSchema
} from '../../../src/modules/auth/repository/email-verification.schema'
import { config } from '../../../src/modules/config'

describe('AuthSchemas', () => {
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let refreshTokenModel: Model<RefreshToken>
  let emailVerificationModel: Model<EmailVerification>

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection

    refreshTokenModel = mongoConnection.model<RefreshToken>('RefreshToken', RefreshTokenSchema)
    emailVerificationModel = mongoConnection.model<EmailVerification>('EmailVerification', EmailVerificationSchema)
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
  })

  describe('RefreshToken Schema', () => {
    it('should hash the token before saving', async () => {
      const userId = new Types.ObjectId()
      const plainToken = 'plain.token.value'

      const refreshToken = new refreshTokenModel({
        userId,
        tokenHash: plainToken
      })

      await refreshToken.save()

      // Verify the token was hashed
      expect(refreshToken.tokenHash).not.toBe(plainToken)
      // Verify it's a valid bcrypt hash
      expect(refreshToken.tokenHash).toMatch(/^\$2[aby]\$\d+\$/)
    })

    it('should correctly compare valid tokens', async () => {
      const userId = new Types.ObjectId()
      const plainToken = 'valid.token.123'

      const refreshToken = new refreshTokenModel({
        userId,
        tokenHash: plainToken
      })

      await refreshToken.save()

      const isValid = await refreshToken.compareToken(plainToken)
      expect(isValid).toBe(true)
    })

    it('should reject invalid tokens', async () => {
      const userId = new Types.ObjectId()
      const plainToken = 'valid.token.123'
      const invalidToken = 'invalid.token.456'

      const refreshToken = new refreshTokenModel({
        userId,
        tokenHash: plainToken
      })

      await refreshToken.save()

      const isValid = await refreshToken.compareToken(invalidToken)
      expect(isValid).toBe(false)
    })

    it('should set createdAt timestamp automatically', async () => {
      const userId = new Types.ObjectId()

      const refreshToken = new refreshTokenModel({
        userId,
        tokenHash: 'token'
      })

      await refreshToken.save()

      expect(refreshToken.createdAt).toBeDefined()
      expect(refreshToken.createdAt instanceof Date).toBe(true)
    })

    it('should not rehash token if not modified', async () => {
      const userId = new Types.ObjectId()
      const plainToken = 'plain.token.value'

      const refreshToken = new refreshTokenModel({
        userId,
        tokenHash: plainToken
      })

      await refreshToken.save()
      const originalHash = refreshToken.tokenHash

      // Update something else but not the token
      refreshToken.userId = new Types.ObjectId()
      await refreshToken.save()

      expect(refreshToken.tokenHash).toBe(originalHash)
    })

    // it('should handle token expiration through TTL index', async () => {
    //   // This is more a documentation test since we can't easily test TTL in memory MongoDB
    //   const schema = RefreshTokenSchema.obj
    //   expect(schema.createdAt.expires).toBeDefined()
    //   expect(schema.createdAt.expires).toBe(60 * 60 * 24 * 30) // 30 days in seconds
    // })
  })

  describe('EmailVerification Schema', () => {
    it('should hash the verification code before saving', async () => {
      const plainCode = '123456'

      const verification = new emailVerificationModel({
        verificationCode: plainCode
      })

      await verification.save()

      // Verify the code was hashed
      expect(verification.verificationCode).not.toBe(plainCode)
      // Verify it's a valid bcrypt hash
      expect(verification.verificationCode).toMatch(/^\$2[aby]\$\d+\$/)
    })

    it('should correctly compare valid verification codes', async () => {
      const plainCode = '123456'

      const verification = new emailVerificationModel({
        verificationCode: plainCode
      })

      await verification.save()

      const isValid = await verification.compareVerificationCode(plainCode)
      expect(isValid).toBe(true)
    })

    it('should reject invalid verification codes', async () => {
      const plainCode = '123456'
      const invalidCode = '654321'

      const verification = new emailVerificationModel({
        verificationCode: plainCode
      })

      await verification.save()

      const isValid = await verification.compareVerificationCode(invalidCode)
      expect(isValid).toBe(false)
    })

    it('should set createdAt timestamp automatically', async () => {
      const verification = new emailVerificationModel({
        verificationCode: '123456'
      })

      await verification.save()

      expect(verification.createdAt).toBeDefined()
      expect(verification.createdAt instanceof Date).toBe(true)
    })

    it('should initialize tries counter to 0', async () => {
      const verification = new emailVerificationModel({
        verificationCode: '123456'
      })

      await verification.save()

      expect(verification.tries).toBe(0)
    })

    it('should not rehash verification code if not modified', async () => {
      const plainCode = '123456'

      const verification = new emailVerificationModel({
        verificationCode: plainCode
      })

      await verification.save()
      const originalHash = verification.verificationCode

      // Update something else but not the verification code
      verification.tries += 1
      await verification.save()

      expect(verification.verificationCode).toBe(originalHash)
    })

    // it('should handle code expiration through TTL index', async () => {
    //   // This is more a documentation test since we can't easily test TTL in memory MongoDB
    //   const schema = EmailVerificationSchema.obj
    //   expect(schema.createdAt.expires).toBeDefined()
    //   expect(schema.createdAt.expires).toBe(180) // 3 minutes in seconds
    // })

    it('should track verification attempts through tries field', async () => {
      const verification = new emailVerificationModel({
        verificationCode: '123456'
      })

      await verification.save()
      expect(verification.tries).toBe(0)

      verification.tries += 1
      await verification.save()
      expect(verification.tries).toBe(1)

      // Retrieve from db to confirm persistence
      const saved = await emailVerificationModel.findById(verification._id)
      expect(saved.tries).toBe(1)
    })

    it('should allow setting initial tries value on creation', async () => {
      const verification = new emailVerificationModel({
        verificationCode: '123456',
        tries: 5
      })

      await verification.save()
      expect(verification.tries).toBe(5)
    })
  })
})
