import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../../../src/modules/auth/auth.controller'
import { AuthService } from '../../../src/modules/auth/services/auth.service'
import { RegistrationService } from '../../../src/modules/auth/services/registration.service'
import { AccountStatus } from '../../../src/modules/users/schemas/user-auth.schema'
import { UnauthorizedException } from '@nestjs/common'
import { RegisterDto } from '../../../src/modules/auth/dto/register.dto'
import { EmailVerifyDto } from '../../../src/modules/auth/dto/email-verify.dto'
import { OnboardingDto } from '../../../src/modules/auth/dto/onboarding.dto'
import { OAuthOnboardingDto } from '../../../src/modules/auth/dto/oauth-onboarding.dto'
import { Types } from 'mongoose'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService
  let registrationService: RegistrationService

  const mockAuthService = {
    getAnonymousUser: jest.fn(),
    oauthEntry: jest.fn(),
    refreshToken: jest.fn()
  }

  const mockRegistrationService = {
    registerLocal: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    registerOnboarding: jest.fn(),
    registerOnboardingOauth: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RegistrationService, useValue: mockRegistrationService }
      ]
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
    registrationService = module.get<RegistrationService>(RegistrationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('anonymous', () => {
    it('should return anonymous user token', async () => {
      const mockToken = { token: 'anonymous-token' }
      mockAuthService.getAnonymousUser.mockResolvedValue(mockToken)

      const result = await controller.anonymous(undefined)

      expect(result).toEqual(mockToken)
      expect(mockAuthService.getAnonymousUser).toHaveBeenCalled()
    })

    it('should handle errors when getting anonymous token', async () => {
      mockAuthService.getAnonymousUser.mockRejectedValue(new Error('Service error'))

      await expect(controller.anonymous(undefined)).rejects.toThrow('Service error')
    })
  })

  describe('login', () => {
    it('should set refresh token cookie and return auth token', async () => {
      const mockUserData = { token: 'auth-token', refreshToken: 'refresh-token' }
      const mockReq = { userData: mockUserData }
      const mockRes = {
        cookie: jest.fn(),
        json: jest.fn()
      }

      await controller.login(mockReq, mockRes)

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh-token',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict'
        })
      )
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'auth-token' })
    })

    it('should throw UnauthorizedException when userData is undefined', async () => {
      const mockReq = { userData: undefined }
      const mockRes = { cookie: jest.fn(), json: jest.fn() }

      await expect(controller.login(mockReq, mockRes)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('googleLogin', () => {
    it('should return undefined (handled by guard)', async () => {
      const result = await controller.googleLogin()
      expect(result).toBeUndefined()
    })
  })

  describe('googleLoginCallback', () => {
    it('should return redirect URL with token', async () => {
      const mockUser = { email: 'test@example.com' }
      const mockToken = { token: 'google-auth-token' }
      mockAuthService.oauthEntry.mockResolvedValue(mockToken)

      const result = await controller.googleLoginCallback({ user: mockUser })

      expect(result).toEqual({
        url: expect.stringContaining('auth/callback?token=google-auth-token')
      })
      expect(mockAuthService.oauthEntry).toHaveBeenCalledWith(mockUser)
    })

    it('should handle errors during OAuth entry', async () => {
      mockAuthService.oauthEntry.mockRejectedValue(new Error('OAuth error'))

      await expect(controller.googleLoginCallback({ user: {} })).rejects.toThrow('OAuth error')
    })
  })

  describe('githubLogin', () => {
    it('should return undefined (handled by guard)', async () => {
      const result = await controller.githubLogin()
      expect(result).toBeUndefined()
    })
  })

  describe('githubLoginCallback', () => {
    it('should return redirect URL with token', async () => {
      const mockUser = { login: 'testuser' }
      const mockToken = { token: 'github-auth-token' }
      mockAuthService.oauthEntry.mockResolvedValue(mockToken)

      const result = await controller.githubLoginCallback({ user: mockUser })

      expect(result).toEqual({
        url: expect.stringContaining('auth/callback?token=github-auth-token')
      })
      expect(mockAuthService.oauthEntry).toHaveBeenCalledWith(mockUser)
    })

    it('should handle errors during OAuth entry', async () => {
      mockAuthService.oauthEntry.mockRejectedValue(new Error('OAuth error'))

      await expect(controller.githubLoginCallback({ user: {} })).rejects.toThrow('OAuth error')
    })
  })

  describe('register', () => {
    it('should register new user when anonymous', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      }
      const mockToken = 'registration-token'
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ANONYMOUS
        }
      }
      mockRegistrationService.registerLocal.mockResolvedValue(mockToken)

      const result = await controller.register(registerDto, mockReq)

      expect(result).toEqual({ token: mockToken })
      expect(mockRegistrationService.registerLocal).toHaveBeenCalledWith(registerDto)
    })

    it('should throw UnauthorizedException when user is not anonymous', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      }
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ACTIVE
        }
      }

      await expect(controller.register(registerDto, mockReq)).rejects.toThrow(UnauthorizedException)
      expect(mockRegistrationService.registerLocal).not.toHaveBeenCalled()
    })

    it('should handle service errors during registration', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      }
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ANONYMOUS
        }
      }
      mockRegistrationService.registerLocal.mockRejectedValue(new Error('Registration failed'))

      await expect(controller.register(registerDto, mockReq)).rejects.toThrow('Registration failed')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email with valid code', async () => {
      const emailVerifyDto: EmailVerifyDto = {
        verificationCode: '123456'
      }
      const mockReq = {
        user: {
          _id: new Types.ObjectId(),
          accountStatus: AccountStatus.EMAIL_VERIFICATION
        }
      }
      const mockResponse = { token: 'new-token' }
      mockRegistrationService.verifyEmail.mockResolvedValue(mockResponse)

      const result = await controller.verifyEmail(emailVerifyDto, mockReq)

      expect(result).toEqual(mockResponse)
      expect(mockRegistrationService.verifyEmail).toHaveBeenCalledWith(
        mockReq.user._id,
        emailVerifyDto.verificationCode
      )
    })

    it('should throw UnauthorizedException when user is not in EMAIL_VERIFICATION state', async () => {
      const emailVerifyDto: EmailVerifyDto = {
        verificationCode: '123456'
      }
      const mockReq = {
        user: {
          _id: new Types.ObjectId(),
          accountStatus: AccountStatus.ACTIVE
        }
      }

      await expect(controller.verifyEmail(emailVerifyDto, mockReq)).rejects.toThrow(UnauthorizedException)
      expect(mockRegistrationService.verifyEmail).not.toHaveBeenCalled()
    })

    it('should handle invalid verification code', async () => {
      const emailVerifyDto: EmailVerifyDto = {
        verificationCode: '123456'
      }
      const mockReq = {
        user: {
          _id: new Types.ObjectId(),
          accountStatus: AccountStatus.EMAIL_VERIFICATION
        }
      }
      mockRegistrationService.verifyEmail.mockRejectedValue(new Error('Invalid verification code'))

      await expect(controller.verifyEmail(emailVerifyDto, mockReq)).rejects.toThrow('Invalid verification code')
    })
  })

  describe('resendEmail', () => {
    it('should resend verification email', async () => {
      const mockReq = {
        user: {
          id: 'user-id'
        }
      }
      const mockResponse = { success: true }
      mockRegistrationService.resendVerificationEmail.mockResolvedValue(mockResponse)

      const result = await controller.resendEmail(undefined, mockReq)

      expect(result).toEqual(mockResponse)
      expect(mockRegistrationService.resendVerificationEmail).toHaveBeenCalledWith(mockReq.user.id)
    })

    it('should handle errors when resending email', async () => {
      const mockReq = {
        user: {
          id: 'user-id'
        }
      }
      mockRegistrationService.resendVerificationEmail.mockRejectedValue(new Error('Email service error'))

      await expect(controller.resendEmail(undefined, mockReq)).rejects.toThrow('Email service error')
    })
  })

  describe('onboarding', () => {
    it('should complete onboarding process', async () => {
      const onboardingDto: OnboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }
      const mockReq = {
        user: {
          _id: new Types.ObjectId()
        }
      }
      const mockResponse = { token: 'onboarding-complete-token' }
      mockRegistrationService.registerOnboarding.mockResolvedValue(mockResponse)

      const result = await controller.onboarding(onboardingDto, mockReq)

      expect(result).toEqual(mockResponse)
      expect(mockRegistrationService.registerOnboarding).toHaveBeenCalledWith(mockReq.user._id, onboardingDto)
    })

    it('should handle errors during onboarding', async () => {
      const onboardingDto: OnboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }
      const mockReq = {
        user: {
          _id: new Types.ObjectId()
        }
      }
      mockRegistrationService.registerOnboarding.mockRejectedValue(new Error('Onboarding failed'))

      await expect(controller.onboarding(onboardingDto, mockReq)).rejects.toThrow('Onboarding failed')
    })
  })

  describe('onboardingOauth', () => {
    it('should complete OAuth onboarding process', async () => {
      const oauthOnboardingDto: OAuthOnboardingDto = {
        username: 'testuser',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { email: 'test@example.com' }
        }
      }
      const mockResponse = { token: 'oauth-onboarding-token' }
      mockRegistrationService.registerOnboardingOauth.mockResolvedValue(mockResponse)

      const result = await controller.onboardingOauth(oauthOnboardingDto, mockReq)

      expect(result).toEqual(mockResponse)
      expect(mockRegistrationService.registerOnboardingOauth).toHaveBeenCalledWith(
        oauthOnboardingDto,
        mockReq.user.data
      )
    })

    it('should throw UnauthorizedException when not in ONBOARDING_OAUTH state', async () => {
      const oauthOnboardingDto: OAuthOnboardingDto = {
        username: 'testuser',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ACTIVE,
          data: { email: 'test@example.com' }
        }
      }

      await expect(controller.onboardingOauth(oauthOnboardingDto, mockReq)).rejects.toThrow(UnauthorizedException)
      expect(mockRegistrationService.registerOnboardingOauth).not.toHaveBeenCalled()
    })

    it('should handle errors during OAuth onboarding', async () => {
      const oauthOnboardingDto: OAuthOnboardingDto = {
        username: 'testuser',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      }
      const mockReq = {
        user: {
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { email: 'test@example.com' }
        }
      }
      mockRegistrationService.registerOnboardingOauth.mockRejectedValue(new Error('OAuth onboarding failed'))

      await expect(controller.onboardingOauth(oauthOnboardingDto, mockReq)).rejects.toThrow('OAuth onboarding failed')
    })
  })

  describe('refreshToken', () => {
    it('should refresh token using valid refresh token from cookies', async () => {
      const mockRefreshToken = 'valid-refresh-token'
      const mockReq = {
        cookies: {
          'refresh-token': mockRefreshToken
        }
      }
      const mockResponse = { token: 'new-auth-token' }
      mockAuthService.refreshToken.mockResolvedValue(mockResponse)

      const result = await controller.refreshToken(mockReq)

      expect(result).toEqual(mockResponse)
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockRefreshToken)
    })

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const mockReq = {
        cookies: {} // No refresh token
      }

      await expect(controller.refreshToken(mockReq)).rejects.toThrow(UnauthorizedException)
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled()
    })

    it('should handle invalid refresh token', async () => {
      const mockRefreshToken = 'invalid-refresh-token'
      const mockReq = {
        cookies: {
          'refresh-token': mockRefreshToken
        }
      }
      mockAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'))

      await expect(controller.refreshToken(mockReq)).rejects.toThrow('Invalid refresh token')
    })

    it('should handle expired refresh token', async () => {
      const mockRefreshToken = 'expired-refresh-token'
      const mockReq = {
        cookies: {
          'refresh-token': mockRefreshToken
        }
      }
      mockAuthService.refreshToken.mockRejectedValue(new UnauthorizedException('Refresh token expired'))

      await expect(controller.refreshToken(mockReq)).rejects.toThrow(UnauthorizedException)
    })
  })
})
