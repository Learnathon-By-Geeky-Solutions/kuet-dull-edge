import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model, Types, Connection, connect } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common'
import { RegistrationService } from '../../../../src/modules/auth/services/registration.service'
import { EmailVerificationService } from '../../../../src/modules/auth/services/emailVerification.service'
import { UserAuthService } from '../../../../src/modules/users/services/user-auth.service'
import { UserDetailsService } from '../../../../src/modules/users/services/user-details.service'
import { UserPeekService } from '../../../../src/modules/users/services/user-peek.service'
import { AccountStatus, UserAuth, UserAuthSchema } from '../../../../src/modules/users/repository/user-auth.schema'
import { UserDetails, UserDetailsSchema } from '../../../../src/modules/users/repository/user-details.schema'
import { UserPeek, UserPeekSchema } from '../../../../src/modules/users/repository/user-peek.schema'
import {
  EmailVerification,
  EmailVerificationSchema
} from '../../../../src/modules/auth/repository/email-verification.schema'

describe('RegistrationService', () => {
  let service: RegistrationService
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let userAuthModel: Model<UserAuth>
  let userDetailsModel: Model<UserDetails>
  let userPeekModel: Model<UserPeek>
  let emailVerificationModel: Model<EmailVerification>

  let emailVerificationService: EmailVerificationService
  let userAuthService: UserAuthService
  let userDetailsService: UserDetailsService
  let userPeekService: UserPeekService
  let jwtService: JwtService

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection

    userAuthModel = mongoConnection.model<UserAuth>('UserAuth', UserAuthSchema)
    userDetailsModel = mongoConnection.model<UserDetails>('UserDetails', UserDetailsSchema)
    userPeekModel = mongoConnection.model<UserPeek>('UserPeek', UserPeekSchema)
    emailVerificationModel = mongoConnection.model<EmailVerification>('EmailVerification', EmailVerificationSchema)
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token')
          }
        },
        {
          provide: EmailVerificationService,
          useValue: {
            createVerification: jest.fn().mockResolvedValue('123456'),
            verifyCode: jest.fn(),
            canResendEmail: jest.fn()
          }
        },
        {
          provide: UserAuthService,
          useValue: {
            findByEmailOrUsername: jest.fn(),
            createUserAuth: jest.fn(),
            findById: jest.fn(),
            updateAccountStatus: jest.fn()
          }
        },
        {
          provide: UserDetailsService,
          useValue: {
            createUserDetails: jest.fn().mockResolvedValue({})
          }
        },
        {
          provide: UserPeekService,
          useValue: {
            createUserPeek: jest.fn().mockResolvedValue({})
          }
        }
      ]
    }).compile()

    service = module.get<RegistrationService>(RegistrationService)
    jwtService = module.get<JwtService>(JwtService)
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService)
    userAuthService = module.get<UserAuthService>(UserAuthService)
    userDetailsService = module.get<UserDetailsService>(UserDetailsService)
    userPeekService = module.get<UserPeekService>(UserPeekService)

    jest.clearAllMocks()
  })

  afterEach(async () => {
    const collections = mongoConnection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  })

  afterAll(async () => {
    await mongoConnection.dropDatabase()
    await mongoConnection.close()
    await mongod.stop()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('registerLocal', () => {
    it('should register a new local user and return token', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      }

      const userAuthMock = {
        _id: new Types.ObjectId(),
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }

      jest.spyOn(userAuthService, 'findByEmailOrUsername').mockResolvedValue(null)
      jest.spyOn(userAuthService, 'createUserAuth').mockResolvedValue(userAuthMock as any)

      const result = await service.registerLocal(userData)

      expect(userAuthService.findByEmailOrUsername).toHaveBeenCalledWith(userData.email, userData.username)
      expect(userAuthService.createUserAuth).toHaveBeenCalledWith({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })
      expect(emailVerificationService.createVerification).toHaveBeenCalledWith(userAuthMock._id.toString())
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: userAuthMock._id,
        accountStatus: userAuthMock.accountStatus
      })
      expect(result).toEqual({ token: 'test-token' })
    })

    it('should throw ConflictException when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existinguser',
        password: 'Password123!'
      }

      jest.spyOn(userAuthService, 'findByEmailOrUsername').mockResolvedValue({ _id: new Types.ObjectId() } as any)

      await expect(service.registerLocal(userData)).rejects.toThrow(ConflictException)
      expect(userAuthService.findByEmailOrUsername).toHaveBeenCalledWith(userData.email, userData.username)
      expect(userAuthService.createUserAuth).not.toHaveBeenCalled()
    })

    it('should throw InternalServerErrorException on database error', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!'
      }

      jest.spyOn(userAuthService, 'findByEmailOrUsername').mockResolvedValue(null)
      jest.spyOn(userAuthService, 'createUserAuth').mockRejectedValue(new Error('Database error'))

      await expect(service.registerLocal(userData)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully and return token', async () => {
      const userId = new Types.ObjectId().toString()
      const verificationCode = '123456'

      const userMock = {
        _id: userId,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }

      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)
      jest.spyOn(emailVerificationService, 'verifyCode').mockResolvedValue(true)

      const result = await service.verifyEmail(userId, verificationCode)

      expect(userAuthService.findById).toHaveBeenCalledWith(userId)
      expect(emailVerificationService.verifyCode).toHaveBeenCalledWith(userId, verificationCode)
      expect(userAuthService.updateAccountStatus).toHaveBeenCalledWith(expect.any(String), AccountStatus.ONBOARDING)
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: userId,
        accountStatus: AccountStatus.ONBOARDING
      })
      expect(result).toEqual({ token: 'test-token' })
    })

    it('should throw BadRequestException when user does not exist', async () => {
      jest.spyOn(userAuthService, 'findById').mockResolvedValue(null)

      await expect(service.verifyEmail('nonexistent-id', '123456')).rejects.toThrow(BadRequestException)
      expect(emailVerificationService.verifyCode).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when account status is not EMAIL_VERIFICATION', async () => {
      const userId = new Types.ObjectId().toString()

      const userMock = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      }

      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)

      await expect(service.verifyEmail(userId, '123456')).rejects.toThrow(BadRequestException)
      expect(emailVerificationService.verifyCode).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when verification code is invalid', async () => {
      const userId = new Types.ObjectId().toString()

      const userMock = {
        _id: userId,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }

      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)
      jest.spyOn(emailVerificationService, 'verifyCode').mockResolvedValue(false)

      await expect(service.verifyEmail(userId, '123456')).rejects.toThrow(BadRequestException)
      expect(userAuthService.updateAccountStatus).not.toHaveBeenCalled()
    })
  })

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      const userId = new Types.ObjectId().toString()
      const userMock = {
        _id: userId,
        email: 'test@example.com',
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      }

      jest.spyOn(emailVerificationService, 'canResendEmail').mockResolvedValue(true)
      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)

      await service.resendVerificationEmail(userId)

      expect(emailVerificationService.canResendEmail).toHaveBeenCalledWith(userId)
      expect(emailVerificationService.createVerification).toHaveBeenCalledWith(userId)
      expect(userAuthService.findById).toHaveBeenCalledWith(userId)
    })

    it('should throw exception when email resend is not allowed', async () => {
      const userId = new Types.ObjectId().toString()

      jest.spyOn(emailVerificationService, 'canResendEmail').mockRejectedValue(new BadRequestException('Too soon'))

      await expect(service.resendVerificationEmail(userId)).rejects.toThrow(BadRequestException)
      expect(emailVerificationService.createVerification).not.toHaveBeenCalled()
    })
  })

  describe('registerOnboarding', () => {
    it('should complete onboarding successfully and return token', async () => {
      const userId = new Types.ObjectId().toString()
      const onboardingData = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }

      const userMock = {
        _id: userId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      }

      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)

      const result = await service.registerOnboarding(userId, onboardingData)

      expect(userAuthService.findById).toHaveBeenCalledWith(userId)
      expect(userPeekService.createUserPeek).toHaveBeenCalledWith({
        _id: userId,
        username: userMock.username,
        name: onboardingData.name
      })
      expect(userDetailsService.createUserDetails).toHaveBeenCalledWith({
        _id: userId,
        birthday: expect.any(Date),
        institute: onboardingData.institute,
        instituteIdentifier: onboardingData.instituteIdentifier
      })
      expect(userAuthService.updateAccountStatus).toHaveBeenCalledWith(expect.any(String), AccountStatus.ACTIVE)
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: userId,
        accountStatus: AccountStatus.ACTIVE
      })
      expect(result).toEqual({ token: 'test-token' })
    })

    it('should throw BadRequestException when account status is not ONBOARDING', async () => {
      const userId = new Types.ObjectId().toString()

      const userMock = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      }

      jest.spyOn(userAuthService, 'findById').mockResolvedValue(userMock as any)

      await expect(
        service.registerOnboarding(userId, {
          name: 'Test User',
          birthday: '1990-01-01',
          institute: 'Test Institute',
          instituteIdentifier: '12345'
        })
      ).rejects.toThrow(BadRequestException)

      expect(userPeekService.createUserPeek).not.toHaveBeenCalled()
    })
  })

  describe('registerOnboardingOauth', () => {
    it('should register OAuth user successfully and return token', async () => {
      const onboardingData = {
        username: 'oauthuser',
        name: 'OAuth User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }

      const oauthData = {
        email: 'oauth@example.com',
        photo: 'http://example.com/photo.jpg'
      }

      const userAuthMock = {
        _id: new Types.ObjectId(),
        username: onboardingData.username
      }

      jest.spyOn(userAuthService, 'createUserAuth').mockResolvedValue(userAuthMock as any)

      const result = await service.registerOnboardingOauth(onboardingData, oauthData)

      expect(userAuthService.createUserAuth).toHaveBeenCalledWith({
        username: onboardingData.username,
        email: oauthData.email,
        password: expect.any(String),
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      expect(userPeekService.createUserPeek).toHaveBeenCalledWith({
        _id: userAuthMock._id,
        username: onboardingData.username,
        name: onboardingData.name,
        photo: oauthData.photo
      })
      expect(userDetailsService.createUserDetails).toHaveBeenCalledWith({
        _id: userAuthMock._id,
        birthday: expect.any(Date),
        institute: onboardingData.institute,
        instituteIdentifier: onboardingData.instituteIdentifier
      })
      expect(userAuthService.updateAccountStatus).toHaveBeenCalledWith(userAuthMock._id, AccountStatus.ACTIVE)
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: userAuthMock._id,
        accountStatus: AccountStatus.ACTIVE
      })
      expect(result).toEqual({ token: 'test-token' })
    })
  })
})
