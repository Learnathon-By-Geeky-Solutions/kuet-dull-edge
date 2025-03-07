import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { Types } from 'mongoose'
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common'
import { AuthService } from '../../../src/modules/auth/auth.service'
import { AccountStatus } from '../../../src/common/interfaces/users.interfaces'
import {
  EmailVerificationRepository,
  RefreshTokenRepository
} from '../../../src/modules/auth/repository/auth.repository'
import {
  UserAuthRepository,
  UserDetailsRepository,
  UserMFARepository,
  UserPeekRepository
} from '../../../src/modules/users/repository/users.repository'

describe('AuthService', () => {
  let service: AuthService
  let jwtService: JwtService
  let userAuthRepository: UserAuthRepository
  let refreshTokenRepository: RefreshTokenRepository
  let emailVerificationRepository: EmailVerificationRepository
  let userPeekRepository: UserPeekRepository
  let userDetailsRepository: UserDetailsRepository
  let user

  const mockUserAuth = {
    _id: new Types.ObjectId(),
    username: 'testuser',
    email: 'test@example.com',
    comparePassword: jest.fn(),
    accountStatus: AccountStatus.ACTIVE
  }

  const mockRefreshToken = {
    compareToken: jest.fn()
  }

  const mockEmailVerification = {
    compareVerificationCode: jest.fn(),
    tries: 0,
    createdAt: new Date(),
    save: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation(payload => `mock_token_${JSON.stringify(payload)}`),
            decode: jest.fn().mockImplementation(token => {
              if (token === 'valid_token') {
                return { registerId: new Types.ObjectId(), accountStatus: AccountStatus.EMAIL_VERIFICATION }
              } else if (token === 'onboarding_token') {
                return { userId: new Types.ObjectId(), accountStatus: AccountStatus.ONBOARDING }
              } else if (token.includes('refresh_token')) {
                return { userId: mockUserAuth._id, rtId: new Types.ObjectId() }
              }
              return { userId: mockUserAuth._id, rtId: new Types.ObjectId() }
            })
          }
        },
        {
          provide: UserAuthRepository,
          useValue: {
            findByEmailOrUsername: jest.fn(),
            findById: jest.fn() as jest.Mock,
            createUser: jest.fn(),
            updateAccountStatus: jest.fn()
          }
        },
        {
          provide: RefreshTokenRepository,
          useValue: {
            createToken: jest.fn(),
            findByUserAndTokenId: jest.fn(),
            deleteToken: jest.fn()
          }
        },
        {
          provide: EmailVerificationRepository,
          useValue: {
            createVerification: jest.fn(),
            findByUserId: jest.fn(),
            deleteByUserId: jest.fn()
          }
        },
        {
          provide: UserPeekRepository,
          useValue: {
            createPeek: jest.fn()
          }
        },
        {
          provide: UserDetailsRepository,
          useValue: {
            createDetails: jest.fn()
          }
        },
        {
          provide: UserMFARepository,
          useValue: {
            findById: jest.fn(),
            findOne: jest.fn(),
            createMFA: jest.fn(),
            updateRecoveryCodes: jest.fn(),
            enableMFA: jest.fn(),
            disableMFA: jest.fn(),
            validateRecoveryCode: jest.fn().mockReturnValue(Promise.resolve(false))
          }
        }
      ]
    }).compile()

    service = module.get<AuthService>(AuthService)
    jwtService = module.get<JwtService>(JwtService)
    userAuthRepository = module.get<UserAuthRepository>(UserAuthRepository)
    refreshTokenRepository = module.get<RefreshTokenRepository>(RefreshTokenRepository)
    emailVerificationRepository = module.get<EmailVerificationRepository>(EmailVerificationRepository)
    userPeekRepository = module.get<UserPeekRepository>(UserPeekRepository)
    userDetailsRepository = module.get<UserDetailsRepository>(UserDetailsRepository)
  })

  describe('getAnonymousToken', () => {
    it('should return a token for anonymous users', () => {
      const token = service.getAnonymousToken()
      expect(token).toContain('mock_token_')
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          _id: null,
          accountStatus: AccountStatus.ANONYMOUS
        },
        { expiresIn: '1d' }
      )
    })
  })

  describe('getToken', () => {
    it('should return a token for authenticated users', () => {
      const userId = new Types.ObjectId()
      const token = service.getToken(userId, AccountStatus.ACTIVE)
      expect(token).toContain('mock_token_')
      expect(jwtService.sign).toHaveBeenCalledWith({
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      })
    })

    it('should generate tokens with different account statuses', () => {
      const userId = new Types.ObjectId()
      const activeToken = service.getToken(userId, AccountStatus.ACTIVE)
      const onboardingToken = service.getToken(userId, AccountStatus.ONBOARDING)

      expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      })

      expect(jwtService.sign).toHaveBeenNthCalledWith(2, {
        _id: userId,
        accountStatus: AccountStatus.ONBOARDING
      })

      expect(activeToken).not.toBe(onboardingToken)
    })
  })

  describe('validateUser', () => {
    it('should return token and refresh token on successful validation', async () => {
      const username = 'testuser'
      const password = 'password'

      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue({
        ...mockUserAuth,
        comparePassword: jest.fn().mockResolvedValue(true)
      })

      service.generateRefreshToken = jest.fn().mockResolvedValue('refresh_token_value')

      const result = await service.validateUser(username, password)

      expect(userAuthRepository.findByEmailOrUsername).toHaveBeenCalledWith('', username)
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken', 'refresh_token_value')
    })

    it('should throw UnauthorizedException when user not found', async () => {
      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(null)

      await expect(service.validateUser('nonexistent', 'password')).rejects.toThrow(
        new UnauthorizedException('INVALID_CREDENTIALS')
      )
    })

    it('should throw UnauthorizedException when password is incorrect', async () => {
      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue({
        ...mockUserAuth,
        comparePassword: jest.fn().mockResolvedValue(false)
      })

      await expect(service.validateUser('testuser', 'wrongpassword')).rejects.toThrow(
        new UnauthorizedException('INVALID_CREDENTIALS')
      )
    })
  })

  describe('generateRefreshToken', () => {
    it('should successfully generate a refresh token', async () => {
      const userId = new Types.ObjectId()
      refreshTokenRepository.createToken = jest.fn().mockResolvedValue(true)

      const token = await service.generateRefreshToken(userId)

      expect(jwtService.sign).toHaveBeenCalled()
      expect(refreshTokenRepository.createToken).toHaveBeenCalled()
      expect(token).toBeDefined()
    })

    it('should retry up to 5 times on failure', async () => {
      const userId = new Types.ObjectId()
      refreshTokenRepository.createToken = jest
        .fn()
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce(true)

      const token = await service.generateRefreshToken(userId)

      expect(refreshTokenRepository.createToken).toHaveBeenCalledTimes(3)
      expect(token).toBeDefined()
    })

    it('should throw an error after 5 failed attempts', async () => {
      const userId = new Types.ObjectId()
      const dbError = new Error('DB Error')

      refreshTokenRepository.createToken = jest.fn().mockRejectedValue(dbError)

      await expect(service.generateRefreshToken(userId)).rejects.toThrow(dbError)
      expect(refreshTokenRepository.createToken).toHaveBeenCalledTimes(5)
    })
  })

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'valid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue({
        compareToken: jest.fn().mockResolvedValue(true)
      })

      const isValid = await service.validateRefreshToken(userId, rtId, token)

      expect(refreshTokenRepository.findByUserAndTokenId).toHaveBeenCalledWith(userId, rtId)
      expect(isValid).toBe(true)
    })

    it('should return false when refresh token not found', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'invalid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue(null)

      const isValid = await service.validateRefreshToken(userId, rtId, token)

      expect(isValid).toBe(false)
    })

    it('should return false when token comparison fails', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'invalid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue({
        compareToken: jest.fn().mockResolvedValue(false)
      })

      const isValid = await service.validateRefreshToken(userId, rtId, token)

      expect(isValid).toBe(false)
    })
  })

  describe('deleteRefreshToken', () => {
    it('should successfully delete a refresh token', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'valid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue({
        compareToken: jest.fn().mockResolvedValue(true)
      })

      refreshTokenRepository.deleteToken = jest.fn().mockResolvedValue(true)

      await service.deleteRefreshToken(userId, rtId, token)

      expect(refreshTokenRepository.deleteToken).toHaveBeenCalledWith(userId, rtId)
    })

    it('should throw UnauthorizedException when token not found', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'invalid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue(null)

      await expect(service.deleteRefreshToken(userId, rtId, token)).rejects.toThrow(
        new UnauthorizedException('REFRESH_TOKEN_NOT_FOUND')
      )
    })

    it('should throw UnauthorizedException when token is invalid', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const token = 'invalid_refresh_token'

      refreshTokenRepository.findByUserAndTokenId = jest.fn().mockResolvedValue({
        compareToken: jest.fn().mockResolvedValue(false)
      })

      await expect(service.deleteRefreshToken(userId, rtId, token)).rejects.toThrow(
        new UnauthorizedException('REFRESH_TOKEN_INVALID')
      )
    })
  })
  describe('oauthEntry', () => {
    it('should return token with oauth data when user does not exist', async () => {
      const email = 'new@example.com'
      const name = 'New User'
      const photo = 'photo_url.jpg'

      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(null)

      const result = await service.oauthEntry({ email, name, photo })

      expect(userAuthRepository.findByEmailOrUsername).toHaveBeenCalledWith(email, '')
      expect(jwtService.sign).toHaveBeenCalledWith({
        _id: null,
        accountStatus: AccountStatus.ONBOARDING_OAUTH,
        data: { email, name, photo }
      })
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken', null)
    })

    it('should return token and refresh token when user exists', async () => {
      const email = 'existing@example.com'
      const name = 'Existing User'
      const photo = 'photo_url.jpg'

      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(mockUserAuth)
      service.generateRefreshToken = jest.fn().mockResolvedValue('refresh_token_value')

      const result = await service.oauthEntry({ email, name, photo })

      expect(userAuthRepository.findByEmailOrUsername).toHaveBeenCalledWith(email, '')
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken', 'refresh_token_value')
      expect(service.generateRefreshToken).toHaveBeenCalledWith(mockUserAuth._id)
    })
  })

  describe('registerLocal', () => {
    const registerDto = {
      username: 'newuser',
      password: 'password123',
      email: 'newuser@example.com'
    }

    it('should register a new user successfully', async () => {
      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(null)

      const newUserId = new Types.ObjectId()
      userAuthRepository.createUser = jest.fn().mockResolvedValue({
        _id: newUserId,
        username: registerDto.username,
        email: registerDto.email,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })

      service.createVerification = jest.fn().mockResolvedValue('123456')
      service.sendVerificationEmail = jest.fn()

      const result = await service.registerLocal(registerDto)

      expect(userAuthRepository.findByEmailOrUsername).toHaveBeenCalledWith(registerDto.email, registerDto.username)
      expect(userAuthRepository.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })
      expect(service.createVerification).toHaveBeenCalledWith(newUserId)
      expect(service.sendVerificationEmail).toHaveBeenCalledWith(registerDto.email, '123456')
      expect(jwtService.sign).toHaveBeenCalledWith({
        registerId: newUserId,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })
      expect(result).toHaveProperty('token')
    })

    it('should throw ConflictException when user already exists', async () => {
      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(mockUserAuth)

      await expect(service.registerLocal(registerDto)).rejects.toThrow(new ConflictException('USER_EXISTS'))

      expect(userAuthRepository.createUser).not.toHaveBeenCalled()
    })

    it('should throw InternalServerErrorException when user creation fails', async () => {
      userAuthRepository.findByEmailOrUsername = jest.fn().mockResolvedValue(null)
      userAuthRepository.createUser = jest.fn().mockResolvedValue(null)

      await expect(service.registerLocal(registerDto)).rejects.toThrow(new InternalServerErrorException('DATABASE'))

      expect(service.createVerification).not.toHaveBeenCalled()
    })
  })

  describe('createVerification', () => {
    it('should create a verification code successfully', async () => {
      const userId = new Types.ObjectId()
      emailVerificationRepository.deleteByUserId = jest.fn().mockResolvedValue(true)
      emailVerificationRepository.createVerification = jest.fn().mockResolvedValue(true)

      const verificationCode = await service.createVerification(userId)

      expect(emailVerificationRepository.deleteByUserId).toHaveBeenCalledWith(userId)
      expect(emailVerificationRepository.createVerification).toHaveBeenCalledWith(userId, expect.any(String))
      expect(verificationCode).toMatch(/^\d{6}$/) // 6-digit code
    })

    it('should throw InternalServerErrorException when verification creation fails', async () => {
      const userId = new Types.ObjectId()
      emailVerificationRepository.deleteByUserId = jest.fn().mockResolvedValue(true)
      emailVerificationRepository.createVerification = jest.fn().mockRejectedValue(new Error('DB Error'))

      await expect(service.createVerification(userId)).rejects.toThrow(
        new InternalServerErrorException('EMAIL_VERIFICATION_SAVE_ERROR')
      )
    })
  })

  describe('verifyCode', () => {
    it('should return true for valid verification code', async () => {
      const userId = new Types.ObjectId()
      const code = '123456'

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue({
        ...mockEmailVerification,
        compareVerificationCode: jest.fn().mockResolvedValue(true)
      })
      emailVerificationRepository.deleteByUserId = jest.fn().mockResolvedValue(true)

      const result = await service.verifyCode(userId, code)

      expect(emailVerificationRepository.findByUserId).toHaveBeenCalledWith(userId)
      expect(emailVerificationRepository.deleteByUserId).toHaveBeenCalledWith(userId)
      expect(result).toBe(true)
    })

    it('should throw BadRequestException when verification record not found', async () => {
      const userId = new Types.ObjectId()
      const code = '123456'

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue(null)

      await expect(service.verifyCode(userId, code)).rejects.toThrow(new BadRequestException('VERIFICATION_INVALID_ID'))
    })

    it('should increment tries and return false for invalid code', async () => {
      const userId = new Types.ObjectId()
      const code = '123456'

      const mockVerification = {
        ...mockEmailVerification,
        tries: 3,
        compareVerificationCode: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true)
      }

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue(mockVerification)

      const result = await service.verifyCode(userId, code)

      expect(mockVerification.tries).toBe(4)
      expect(mockVerification.save).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should throw BadRequestException when tries exceed limit', async () => {
      const userId = new Types.ObjectId()
      const code = '123456'

      const mockVerification = {
        ...mockEmailVerification,
        tries: 10,
        compareVerificationCode: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true)
      }

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue(mockVerification)
      emailVerificationRepository.deleteByUserId = jest.fn().mockResolvedValue(true)

      await expect(service.verifyCode(userId, code)).rejects.toThrow(
        new BadRequestException('VERIFICATION_TRIES_EXCEEDED')
      )

      expect(mockVerification.tries).toBe(11)
      expect(emailVerificationRepository.deleteByUserId).toHaveBeenCalledWith(userId)
    })

    it('should throw InternalServerErrorException when saving tries fails', async () => {
      const userId = new Types.ObjectId()
      const code = '123456'

      const mockVerification = {
        ...mockEmailVerification,
        tries: 3,
        compareVerificationCode: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockRejectedValue(new Error('DB Error'))
      }

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue(mockVerification)

      await expect(service.verifyCode(userId, code)).rejects.toThrow(new InternalServerErrorException('ERROR'))
    })
  })

  describe('canResendEmail', () => {
    it('should return true when no verification exists', async () => {
      const userId = new Types.ObjectId()

      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue(null)

      const result = await service.canResendEmail(userId)
      expect(result).toBe(true)
    })

    it('should return true when last verification is older than 60 seconds', async () => {
      const userId = new Types.ObjectId()

      const twoMinutesAgo = new Date(Date.now() - 120000) // 2 minutes ago
      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue({
        createdAt: twoMinutesAgo
      })

      const result = await service.canResendEmail(userId)
      expect(result).toBe(true)
    })

    it('should throw BadRequestException when last verification is within 60 seconds', async () => {
      const userId = new Types.ObjectId()

      const thirtySecondsAgo = new Date(Date.now() - 30000) // 30 seconds ago
      emailVerificationRepository.findByUserId = jest.fn().mockResolvedValue({
        createdAt: thirtySecondsAgo
      })

      await expect(service.canResendEmail(userId)).rejects.toThrow(
        new BadRequestException('EMAIL_VERIFICATION_RESEND_TOO_SOON')
      )
    })
  })

  describe('verifyEmail', () => {
    const verifyEmailDto = {
      token: 'valid_token',
      verificationCode: '123456'
    }

    it('should verify email successfully', async () => {
      const userId = new Types.ObjectId()

      jwtService.decode = jest.fn().mockReturnValue({ registerId: userId })

      userAuthRepository.findById = jest.fn().mockResolvedValue({
        _id: userId,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })

      service.verifyCode = jest.fn().mockResolvedValue(true)
      userAuthRepository.updateAccountStatus = jest.fn().mockResolvedValue(true)

      const result = await service.verifyEmail(verifyEmailDto)

      expect(userAuthRepository.findById).toHaveBeenCalledWith(userId)
      expect(service.verifyCode).toHaveBeenCalledWith(userId, verifyEmailDto.verificationCode)
      expect(userAuthRepository.updateAccountStatus).toHaveBeenCalledWith(userId, AccountStatus.ONBOARDING)
      expect(result).toHaveProperty('token')
    })

    it('should throw BadRequestException for invalid token', async () => {
      jwtService.decode = jest.fn().mockReturnValue({ someOtherField: 'value' })

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(new BadRequestException('INVALID_TOKEN'))
    })

    it('should throw BadRequestException when user not found', async () => {
      const userId = new Types.ObjectId()

      jwtService.decode = jest.fn().mockReturnValue({ registerId: userId })
      userAuthRepository.findById = jest.fn().mockResolvedValue(null)

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        new BadRequestException('INVALID_ACCOUNT_STATUS')
      )
    })

    it('should throw BadRequestException for incorrect account status', async () => {
      const userId = new Types.ObjectId()

      jwtService.decode = jest.fn().mockReturnValue({ registerId: userId })

      userAuthRepository.findById = jest.fn().mockResolvedValue({
        _id: userId,
        accountStatus: AccountStatus.ACTIVE // Not EMAIL_VERIFICATION
      })

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        new BadRequestException('INVALID_ACCOUNT_STATUS')
      )
    })

    it('should throw BadRequestException when verification code is invalid', async () => {
      const userId = new Types.ObjectId()

      jwtService.decode = jest.fn().mockReturnValue({ registerId: userId })

      userAuthRepository.findById = jest.fn().mockResolvedValue({
        _id: userId,
        accountStatus: AccountStatus.EMAIL_VERIFICATION
      })

      service.verifyCode = jest.fn().mockResolvedValue(false)

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        new BadRequestException('VERIFICATION_CODE_INVALID')
      )
    })
  })

  describe('registerOnboarding', () => {
    const mockOnboardingDto = {
      token: 'onboarding_token',
      name: 'Test User',
      birthday: '1990-01-01',
      institute: 'Test University',
      instituteIdentifier: '12345'
    }

    const mockUserId = new Types.ObjectId()

    beforeEach(() => {
      // Reset mocks before each test
      jwtService.decode.mockReset()
      userAuthRepository.findById.mockReset()
      userAuthRepository.updateAccountStatus.mockReset()
      userPeekRepository.createPeek.mockReset()
      userDetailsRepository.createDetails.mockReset()
    })

    it('should successfully complete onboarding process', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })

      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })

      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      // Execute
      const result = await service.registerOnboarding(mockOnboardingDto)

      // Assert
      expect(jwtService.decode).toHaveBeenCalledWith(mockOnboardingDto.token)
      expect(userAuthRepository.findById).toHaveBeenCalledWith(mockUserId)
      expect(userPeekRepository.createPeek).toHaveBeenCalledWith(mockUserId, {
        username: 'testuser',
        name: mockOnboardingDto.name
      })
      expect(userDetailsRepository.createDetails).toHaveBeenCalledWith(mockUserId, {
        birthday: new Date(mockOnboardingDto.birthday),
        institute: mockOnboardingDto.institute,
        instituteIdentifier: mockOnboardingDto.instituteIdentifier
      })
      expect(userAuthRepository.updateAccountStatus).toHaveBeenCalledWith(mockUserId, AccountStatus.ACTIVE)
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUserId,
        accountStatus: AccountStatus.ACTIVE
      })
      expect(result).toHaveProperty('token')
    })

    it('should throw BadRequestException when token has no userId', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ someOtherField: 'value' })

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(
        new BadRequestException('INVALID_TOKEN')
      )
      expect(userAuthRepository.findById).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when user is not found', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue(null)

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(
        new BadRequestException('USER_NOT_FOUND')
      )
      expect(userPeekRepository.createPeek).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when user account status is not ONBOARDING', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ACTIVE // Not ONBOARDING
      })

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(
        new BadRequestException('INVALID_ACCOUNT_STATUS')
      )
      expect(userPeekRepository.createPeek).not.toHaveBeenCalled()
    })

    it('should handle errors from userPeekRepository', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })
      userPeekRepository.createPeek.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(Error)
      expect(userDetailsRepository.createDetails).not.toHaveBeenCalled()
      expect(userAuthRepository.updateAccountStatus).not.toHaveBeenCalled()
    })

    it('should handle errors from userDetailsRepository', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(Error)
      expect(userAuthRepository.updateAccountStatus).not.toHaveBeenCalled()
    })

    it('should handle errors from updating account status', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(service.registerOnboarding(mockOnboardingDto)).rejects.toThrow(Error)
    })

    it('should correctly parse and convert birthday string to Date object', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      const dtoBirthday = '1995-03-15'
      const dto = { ...mockOnboardingDto, birthday: dtoBirthday }

      // Execute
      await service.registerOnboarding(dto)

      // Assert
      expect(userDetailsRepository.createDetails).toHaveBeenCalledWith(mockUserId, {
        birthday: new Date(dtoBirthday),
        institute: dto.institute,
        instituteIdentifier: dto.instituteIdentifier
      })
    })

    it('should validate the returned token contains correct information', async () => {
      // Setup
      jwtService.decode.mockReturnValue({ userId: mockUserId })
      userAuthRepository.findById.mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        accountStatus: AccountStatus.ONBOARDING
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      // Execute
      const result = await service.registerOnboarding(mockOnboardingDto)

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUserId,
        accountStatus: AccountStatus.ACTIVE
      })
      expect(result).toHaveProperty('token')
      expect(result.token).toContain('mock_token_')
    })
  })

  describe('registerOnboardingOauth', () => {
    const mockOauthOnboardingDto = {
      username: 'oauth_user',
      name: 'OAuth User',
      birthday: '1992-05-20',
      institute: 'OAuth University',
      instituteIdentifier: '98765'
    }

    const mockEmail = 'oauth@example.com'
    const mockPhoto = 'https://example.com/photo.jpg'
    const mockUserId = new Types.ObjectId()

    beforeEach(() => {
      // Reset mocks before each test
      userAuthRepository.createUser.mockReset()
      userPeekRepository.createPeek.mockReset()
      userDetailsRepository.createDetails.mockReset()
      userAuthRepository.updateAccountStatus.mockReset()
      jwtService.sign.mockClear()
    })

    it('should successfully register OAuth user and complete onboarding', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        email: mockEmail,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      // Execute
      const result = await service.registerOnboardingOauth(mockOauthOnboardingDto, {
        email: mockEmail,
        photo: mockPhoto
      })

      // Assert
      expect(userAuthRepository.createUser).toHaveBeenCalledWith({
        username: mockOauthOnboardingDto.username,
        email: mockEmail,
        password: expect.any(String),
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })

      expect(userPeekRepository.createPeek).toHaveBeenCalledWith(mockUserId, {
        username: mockOauthOnboardingDto.username,
        name: mockOauthOnboardingDto.name,
        photo: mockPhoto
      })

      expect(userDetailsRepository.createDetails).toHaveBeenCalledWith(mockUserId, {
        birthday: new Date(mockOauthOnboardingDto.birthday),
        institute: mockOauthOnboardingDto.institute,
        instituteIdentifier: mockOauthOnboardingDto.instituteIdentifier
      })

      expect(userAuthRepository.updateAccountStatus).toHaveBeenCalledWith(mockUserId, AccountStatus.ACTIVE)

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUserId,
        accountStatus: AccountStatus.ACTIVE
      })

      expect(result).toHaveProperty('token')
    })

    it('should generate a random password for OAuth users', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      // Execute
      await service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: mockPhoto })

      // Assert - checking the password is a random string
      const createUserCall = userAuthRepository.createUser.mock.calls[0][0]
      expect(createUserCall.password).toBeTruthy()
      expect(createUserCall.password.length).toBeGreaterThanOrEqual(16) // hex string from 8 bytes
    })

    it('should handle errors from userAuthRepository', async () => {
      // Setup
      userAuthRepository.createUser.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(
        service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: mockPhoto })
      ).rejects.toThrow(Error)

      expect(userPeekRepository.createPeek).not.toHaveBeenCalled()
    })

    it('should handle errors from userPeekRepository', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(
        service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: mockPhoto })
      ).rejects.toThrow(Error)

      expect(userDetailsRepository.createDetails).not.toHaveBeenCalled()
    })

    it('should handle errors from userDetailsRepository', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(
        service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: mockPhoto })
      ).rejects.toThrow(Error)

      expect(userAuthRepository.updateAccountStatus).not.toHaveBeenCalled()
    })

    it('should handle errors from updating account status', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockRejectedValue(new Error('DB Error'))

      // Execute & Assert
      await expect(
        service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: mockPhoto })
      ).rejects.toThrow(Error)
    })

    it('should correctly handle photo property in user peek creation', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      const customPhoto = 'custom_photo_url.jpg'

      // Execute
      await service.registerOnboardingOauth(mockOauthOnboardingDto, { email: mockEmail, photo: customPhoto })

      // Assert
      expect(userPeekRepository.createPeek).toHaveBeenCalledWith(mockUserId, {
        username: mockOauthOnboardingDto.username,
        name: mockOauthOnboardingDto.name,
        photo: customPhoto
      })
    })

    it('should correctly parse and convert birthday string to Date object', async () => {
      // Setup
      userAuthRepository.createUser.mockResolvedValue({
        _id: mockUserId,
        username: mockOauthOnboardingDto.username,
        accountStatus: AccountStatus.ONBOARDING_OAUTH
      })
      userPeekRepository.createPeek.mockResolvedValue(true)
      userDetailsRepository.createDetails.mockResolvedValue(true)
      userAuthRepository.updateAccountStatus.mockResolvedValue(true)

      const dtoBirthday = '1988-12-25'
      const dto = { ...mockOauthOnboardingDto, birthday: dtoBirthday }

      // Execute
      await service.registerOnboardingOauth(dto, { email: mockEmail, photo: mockPhoto })

      // Assert
      expect(userDetailsRepository.createDetails).toHaveBeenCalledWith(mockUserId, {
        birthday: new Date(dtoBirthday),
        institute: dto.institute,
        instituteIdentifier: dto.instituteIdentifier
      })
    })
  })
})
