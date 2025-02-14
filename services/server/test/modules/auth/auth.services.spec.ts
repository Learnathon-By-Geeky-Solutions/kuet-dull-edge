import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose'
import { Connection, Model, Types } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { AuthService } from '../../../src/modules/auth/services/auth.service'
import {
  AccountStatus,
  UserAuth,
  UserAuthSchema
} from '../../../src/modules/users/schemas/user-auth.schema'
import { RegistrationService } from '../../../src/modules/auth/services/registration.service'
import {
  EmailVerification,
  EmailVerificationSchema
} from '../../../src/modules/auth/schemas/email-verification.schema'
import {
  UserPeek,
  UserPeekSchema
} from '../../../src/modules/users/schemas/user-peek.schema'
import {
  UserDetails,
  UserDetailsSchema
} from '../../../src/modules/users/schemas/user-details.schema'

describe('AuthService', () => {
  let authService: AuthService
  let jwtService: JwtService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'signedToken')
          }
        }
      ]
    }).compile()

    authService = moduleRef.get<AuthService>(AuthService)
    jwtService = moduleRef.get<JwtService>(JwtService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  it('should return a signed token for an anonymous user', async () => {
    const token = await authService.getAnonymousUser()
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        accountStatus: AccountStatus.ANONYMOUS,
        _id: expect.any(String)
      })
    )
    expect(token).toBe('signedToken')
  })
})

describe('RegistrationService (in-memory MongoDB)', () => {
  let service: RegistrationService
  let mongoConnection: Connection
  let mongod: MongoMemoryServer

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: UserAuth.name, schema: UserAuthSchema },
          { name: UserPeek.name, schema: UserPeekSchema },
          { name: UserDetails.name, schema: UserDetailsSchema },
          { name: EmailVerification.name, schema: EmailVerificationSchema }
        ])
      ],
      providers: [
        RegistrationService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('testToken') }
        }
      ]
    }).compile()

    service = module.get<RegistrationService>(RegistrationService)
    mongoConnection = module.get(getConnectionToken())
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

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('registerLocal', () => {
    it('should throw an error if email or username already exists', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      await new userAuthModel({
        username: 'username',
        email: 'email@example.com',
        password: 'sdfdsfds'
      }).save()

      await expect(
        service.registerLocal({
          username: 'username',
          email: 'email@example.com',
          password: 'password',
          captchaToken: 'captcha'
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should return a token if registration is successful', async () => {
      const token = await service.registerLocal({
        username: 'username',
        email: 'email@email.com',
        password: 'password',
        captchaToken: 'captcha'
      })
      expect(token).toBe('testToken')
    })
  })

  describe('verifyEmail', () => {
    it('should throw error if email verification record does not exist', async () => {
      await expect(
        service.verifyEmail('NOnExsitent', '123456')
      ).rejects.toThrow()
    })
    it('should throw error if user account status is not EMAIL_VERIFICATION', async () => {
      const userAuthModel: Model<UserAuth> = mongoConnection.model<UserAuth>(
        UserAuth.name,
        UserAuthSchema
      )
      const user: UserAuth = await new userAuthModel({
        _id: new Types.ObjectId(),
        username: 'user1',
        email: 'a@a.com',
        password: 'pass',
        accountStatus: AccountStatus.ACTIVE
      }).save()

      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      await new emailVerificationModel({
        _id: user._id,
        verificationCode: '123456'
      }).save()
      await expect(
        service.verifyEmail(user._id.toHexString(), '123456')
      ).rejects.toThrow()
    })
    it('should throw error and increment tries for invalid verification code', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      const user = await new userAuthModel({
        username: 'user2',
        email: 'user2@example.com',
        password: 'pass',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }).save()

      const emailVerificationDoc = new emailVerificationModel({
        _id: user._id,
        verificationCode: '654321',
        tries: 0
      })

      emailVerificationDoc.compareVerificationCode = jest
        .fn()
        .mockResolvedValue(false)
      await emailVerificationDoc.save()

      await expect(
        service.verifyEmail(user._id.toHexString(), '000000')
      ).rejects.toThrow()

      const updatedDoc = await emailVerificationModel.findOne({
        _id: user._id
      })
      expect(updatedDoc.tries).toBe(1)
    })

    it('should throw error and delete user when verification tries exceed limit', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      const user = await new userAuthModel({
        username: 'user3',
        email: 'user3@example.com',
        password: 'pass',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }).save()

      const emailVerificationDoc = new emailVerificationModel({
        _id: user._id,
        verificationCode: '111111',
        tries: 11
      })
      emailVerificationDoc.compareVerificationCode = jest
        .fn()
        .mockResolvedValue(false)
      await emailVerificationDoc.save()

      await expect(
        service.verifyEmail(user._id.toString(), '111111')
      ).rejects.toThrow()

      const deletedUser = await userAuthModel.findById(user._id)
      expect(deletedUser).toBeNull()
    })

    it('should update accountStatus and return token on valid verification', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      const user = await new userAuthModel({
        username: 'user4',
        email: 'user4@example.com',
        password: 'pass',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }).save()

      const emailVerificationDoc = new emailVerificationModel({
        _id: user._id,
        verificationCode: '222222',
        tries: 0
      })
      emailVerificationDoc.compareVerificationCode = jest
        .fn()
        .mockResolvedValue(true)
      await emailVerificationDoc.save()

      const token = await service.verifyEmail(user._id.toString(), '222222')
      expect(token).toBe('testToken')

      const updatedUser = await userAuthModel.findById(user._id)
      expect(updatedUser.accountStatus).toBe(AccountStatus.ONBOARDING)

      const deletedVerification = await emailVerificationModel.findOne({
        _id: user._id
      })
      expect(deletedVerification).toBeNull()
    })
  })

  describe('resendVerificationEmail', () => {
    it('should throw error if resend is attempted too soon', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      const user = await new userAuthModel({
        username: 'user5',
        email: 'user5@example.com',
        password: 'pass',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }).save()

      const emailVerificationDoc = new emailVerificationModel({
        _id: user._id,
        verificationCode: '333333',
        createdAt: new Date()
      })
      await emailVerificationDoc.save()

      await expect(
        service.resendVerificationEmail(user._id.toString())
      ).rejects.toThrow()
    })

    it('should resend verification email if allowed', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const emailVerificationModel = mongoConnection.model(
        EmailVerification.name,
        EmailVerificationSchema
      )
      const user = await new userAuthModel({
        username: 'user6',
        email: 'user6@example.com',
        password: 'pass',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }).save()

      const pastDate = new Date(Date.now() - 61000)
      const emailVerificationDoc = new emailVerificationModel({
        _id: user._id,
        verificationCode: '444444',
        createdAt: pastDate
      })
      await emailVerificationDoc.save()

      await expect(
        service.resendVerificationEmail(user._id.toString())
      ).resolves.toBeUndefined()

      const newRecord = await emailVerificationModel.findOne({ _id: user._id })
      expect(newRecord).toBeDefined()
    })
  })

  describe('registerOnboarding', () => {
    it('should throw error if user account status is not ONBOARDING', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const user = await new userAuthModel({
        username: 'user7',
        email: 'user7@example.com',
        password: 'pass',
        accountStatus: AccountStatus.ACTIVE
      }).save()

      await expect(
        service.registerOnboarding(user._id.toString(), {
          name: 'User Seven',
          birthday: new Date().toISOString(),
          institute: 'Institute',
          instituteIdentifier: 'ID'
        })
      ).rejects.toThrow()
    })

    it('should update user details and return token on successful onboarding', async () => {
      const userAuthModel = mongoConnection.model(UserAuth.name, UserAuthSchema)
      const userPeekModel = mongoConnection.model(UserPeek.name, UserPeekSchema)
      const userDetailsModel = mongoConnection.model(
        UserDetails.name,
        UserDetailsSchema
      )

      const user = await new userAuthModel({
        username: 'user8',
        email: 'user8@example.com',
        password: 'pass',
        accountStatus: AccountStatus.ONBOARDING
      }).save()

      const onboardingData = {
        name: 'User Eight',
        birthday: new Date('1990-01-01').toISOString(),
        institute: 'Institute',
        instituteIdentifier: 'ID'
      }

      const token = await service.registerOnboarding(
        user._id.toString(),
        onboardingData
      )
      expect(token).toBe('testToken')

      const peek = await userPeekModel.findById(user._id)
      expect(peek.username).toBe(user.username)
      expect(peek.name).toBe(onboardingData.name)

      const details = await userDetailsModel.findById(user._id)
      expect(details.institute).toBe(onboardingData.institute)
    })
  })
})
