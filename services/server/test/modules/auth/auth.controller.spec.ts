import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller'
import { AuthService } from '../../../src/modules/auth/auth.service'
import { JwtAuthGuard } from '../../../src/guards/jwt-auth.guard'
import { GoogleAuthGuard } from '../../../src/guards/google.guard'
import { LocalAuthGuard } from '../../../src/guards/local-auth.guard'
import { UnauthorizedException } from '@nestjs/common'
import { AccountStatus } from '../../../src/common/interfaces/users.interfaces'
import { config } from '../../../src/modules/config'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  beforeEach(async () => {
    const authServiceMock = {
      getAnonymousToken: jest.fn(),
      oauthEntry: jest.fn(),
      refreshToken: jest.fn(),
      registerLocal: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      registerOnboarding: jest.fn(),
      registerOnboardingOauth: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        }
      ]
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(GoogleAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('anonymous', () => {
    it('should return anonymous token', async () => {
      const expectedToken = { token: 'anonymous-token' }
      jest.spyOn(authService, 'getAnonymousToken').mockResolvedValue(expectedToken)

      const result = await controller.anonymous(undefined)

      expect(authService.getAnonymousToken).toHaveBeenCalled()
      expect(result).toEqual(expectedToken)
    })

    it('should handle errors when getting anonymous token', async () => {
      const error = new Error('Service error')
      jest.spyOn(authService, 'getAnonymousToken').mockRejectedValue(error)

      await expect(controller.anonymous(undefined)).rejects.toThrow(error)
    })
  })

  describe('login', () => {
    it('should return token and set refresh token cookie on successful login', async () => {
      const req = {
        userData: {
          token: 'auth-token',
          refreshToken: 'refresh-token'
        }
      }

      const res = {
        cookie: jest.fn(),
        json: jest.fn()
      }

      await controller.login(req, res)

      expect(res.cookie).toHaveBeenCalledWith('refresh-token', 'refresh-token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: config._.mode === 'production'
      })
      expect(res.json).toHaveBeenCalledWith({ token: 'auth-token' })
    })

    it('should throw UnauthorizedException when userData is undefined', async () => {
      const req = { userData: undefined }
      const res = {} as Response

      await expect(controller.login(req, res)).rejects.toThrow(UnauthorizedException)
      await expect(controller.login(req, res)).rejects.toThrow('INVALID_CREDENTIALS')
    })
  })

  describe('googleLogin', () => {
    it('should return undefined (function just initiates OAuth flow)', async () => {
      const result = await controller.googleLogin()
      expect(result).toBeUndefined()
    })
  })

  describe('googleLoginCallback', () => {
    it('should redirect to frontend with token', async () => {
      const req = {
        user: { id: 'google-user-id' }
      }

      const token = 'google-auth-token'
      const frontendUrl = 'http://localhost:4000'

      process.env.FRONTEND_URL = frontendUrl

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token })

      const result = await controller.googleLoginCallback(req)

      expect(authService.oauthEntry).toHaveBeenCalledWith(req.user)
      expect(result).toEqual({
        url: `${frontendUrl}/auth/callback?token=${token}`
      })
    })

    it('should use default frontend URL if env variable is not set', async () => {
      const req = {
        user: { id: 'google-user-id' }
      }

      const token = 'google-auth-token'
      const defaultFrontendUrl = 'http://localhost:4000'

      process.env.FRONTEND_URL = '' // Clear env variable

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token })

      const result = await controller.googleLoginCallback(req)

      expect(authService.oauthEntry).toHaveBeenCalledWith(req.user)
      expect(result).toEqual({
        url: `${defaultFrontendUrl}/auth/callback?token=${token}`
      })
    })

    it('should handle errors during OAuth entry', async () => {
      const req = {
        user: { id: 'google-user-id' }
      }

      const error = new Error('OAuth entry failed')
      jest.spyOn(authService, 'oauthEntry').mockRejectedValue(error)

      await expect(controller.googleLoginCallback(req)).rejects.toThrow(error)
    })
  })

  describe('githubLogin', () => {
    it('should return undefined (function just initiates OAuth flow)', async () => {
      const result = await controller.githubLogin()
      expect(result).toBeUndefined()
    })
  })

  describe('githubLoginCallback', () => {
    it('should redirect to frontend with token', async () => {
      const req = {
        user: { id: 'github-user-id' }
      }

      const token = 'github-auth-token'
      const refreshToken = 'token'
      const frontendUrl = 'http://localhost:4000'

      process.env.FRONTEND_URL = frontendUrl

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token, refreshToken })

      const result = await controller.githubLoginCallback(req)

      expect(authService.oauthEntry).toHaveBeenCalledWith(req.user)
      expect(result).toEqual({
        url: `${frontendUrl}/auth/callback?token=${token}`
      })
    })

    it('should use default frontend URL if env variable is not set', async () => {
      const req = {
        user: { id: 'github-user-id' }
      }

      const token = 'github-auth-token'
      const refreshToken = 'token'
      const defaultFrontendUrl = 'http://localhost:4000'

      delete process.env.FRONTEND_URL // Clear env variable

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token, refreshToken })

      const result = await controller.githubLoginCallback(req)

      expect(authService.oauthEntry).toHaveBeenCalledWith(req.user)
      expect(result).toEqual({
        url: `${defaultFrontendUrl}/auth/callback?token=${token}`
      })
    })

    it('should handle errors during OAuth entry', async () => {
      const req = {
        user: { id: 'github-user-id' }
      }

      const error = new Error('OAuth entry failed')
      jest.spyOn(authService, 'oauthEntry').mockRejectedValue(error)

      await expect(controller.githubLoginCallback(req)).rejects.toThrow(error)
    })

    it('should properly encode tokens in the redirect URL', async () => {
      const req = {
        user: { id: 'github-user-id' }
      }

      // Token with special characters that should be URI-encoded
      const token = 'github+token/with?special&characters'
      const frontendUrl = 'http://localhost:4000'
      const refreshToken = 'token'
      process.env.FRONTEND_URL = frontendUrl

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token, refreshToken })

      const result = await controller.githubLoginCallback(req)

      expect(result.url).toContain(`token=${token}`)
      // The URL should be usable (no need to manually encode since browsers handle this)
      expect(result.url).toEqual(`${frontendUrl}/auth/callback?token=${token}`)
    })

    it('should handle custom frontend URLs with trailing slashes', async () => {
      const req = {
        user: { id: 'github-user-id' }
      }

      const token = 'github-auth-token'
      const refreshToken = 'token'
      const frontendUrl = 'http://localhost:4000'

      process.env.FRONTEND_URL = frontendUrl

      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token, refreshToken })

      const result = await controller.githubLoginCallback(req)

      // Should correctly handle the URL without double slashes
      expect(result.url).toEqual(`http://localhost:4000/auth/callback?token=${token}`)
    })

    it('should handle empty user object from GitHub', async () => {
      const req = {
        user: {}
      }

      const token = 'github-auth-token'
      const refreshToken = 'token'
      jest.spyOn(authService, 'oauthEntry').mockResolvedValue({ token, refreshToken })

      const result = await controller.githubLoginCallback(req)

      expect(authService.oauthEntry).toHaveBeenCalledWith(req.user)
      expect(result.url).toContain(`token=${token}`)
    })
  })

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with correct parameters', async () => {
      const emailVerifyDto = {
        verificationCode: '123456',
        token: 'jwt-token-here'
      }

      const req = { user: { id: 'user-id' } }
      const expectedResult = { token: 'verified-token' }

      jest.spyOn(authService, 'verifyEmail').mockResolvedValue(expectedResult)

      const result = await controller.verifyEmail(emailVerifyDto, req)

      expect(authService.verifyEmail).toHaveBeenCalledWith(emailVerifyDto)
      expect(result).toEqual(expectedResult)
    })

    it('should handle verification errors', async () => {
      const emailVerifyDto = {
        verificationCode: 'invalid',
        token: 'jwt-token-here'
      }

      const req = { user: { id: 'user-id' } }
      const error = new Error('Invalid verification code')

      jest.spyOn(authService, 'verifyEmail').mockRejectedValue(error)

      await expect(controller.verifyEmail(emailVerifyDto, req)).rejects.toThrow(error)
    })
  })

  describe('resendEmail', () => {
    it('should call authService.resendVerificationEmail with token', async () => {
      const body = { token: 'jwt-token' }
      const expectedResult = { success: true }

      jest.spyOn(authService, 'resendVerificationEmail').mockResolvedValue(expectedResult)

      const result = await controller.resendEmail(body)

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(body.token)
      expect(result).toEqual(expectedResult)
    })

    it('should handle errors when resending verification email', async () => {
      const body = { token: 'jwt-token' }
      const error = new Error('Failed to resend email')

      jest.spyOn(authService, 'resendVerificationEmail').mockRejectedValue(error)

      await expect(controller.resendEmail(body)).rejects.toThrow(error)
    })
  })

  describe('onboarding', () => {
    it('should call authService.registerOnboarding with correct parameters', async () => {
      const onboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test University',
        instituteIdentifier: '12345',
        token: 'jwt-token'
      }

      const expectedResult = { token: 'onboarded-token' }

      jest.spyOn(authService, 'registerOnboarding').mockResolvedValue(expectedResult)

      const result = await controller.onboarding(onboardingDto)

      expect(authService.registerOnboarding).toHaveBeenCalledWith(onboardingDto)
      expect(result).toEqual(expectedResult)
    })

    it('should handle onboarding errors', async () => {
      const onboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test University',
        instituteIdentifier: '12345',
        token: 'jwt-token'
      }

      const error = new Error('Onboarding failed')

      jest.spyOn(authService, 'registerOnboarding').mockRejectedValue(error)

      await expect(controller.onboarding(onboardingDto)).rejects.toThrow(error)
    })
  })

  describe('onboardingOauth', () => {
    it('should throw UnauthorizedException if user status is not ONBOARDING_OAUTH', async () => {
      const oauthOnboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test University',
        instituteIdentifier: '12345',
        token: 'jwt-token',
        username: 'testuser'
      }

      const req = {
        user: {
          accountStatus: AccountStatus.ACTIVE,
          data: { providerId: 'github-1234' }
        }
      }

      await expect(controller.onboardingOauth(oauthOnboardingDto, req)).rejects.toThrow(UnauthorizedException)
    })

    it('should call authService.registerOnboardingOauth with correct parameters', async () => {
      const oauthOnboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test University',
        instituteIdentifier: '12345',
        token: 'jwt-token',
        username: 'testuser'
      }

      const req = {
        user: {
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { providerId: 'github-1234' }
        }
      }

      const expectedResult = { token: 'oauth-onboarded-token' }

      jest.spyOn(authService, 'registerOnboardingOauth').mockResolvedValue(expectedResult)

      const result = await controller.onboardingOauth(oauthOnboardingDto, req)

      expect(authService.registerOnboardingOauth).toHaveBeenCalledWith(oauthOnboardingDto, req.user.data)
      expect(result).toEqual(expectedResult)
    })

    it('should handle OAuth onboarding errors', async () => {
      const oauthOnboardingDto = {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test University',
        instituteIdentifier: '12345',
        token: 'jwt-token',
        username: 'testuser'
      }

      const req = {
        user: {
          accountStatus: AccountStatus.ONBOARDING_OAUTH,
          data: { providerId: 'github-1234' }
        }
      }

      const error = new Error('OAuth onboarding failed')

      jest.spyOn(authService, 'registerOnboardingOauth').mockRejectedValue(error)

      await expect(controller.onboardingOauth(oauthOnboardingDto, req)).rejects.toThrow(error)
    })
  })

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if refresh token is missing', async () => {
      const req = { cookies: {} }

      await expect(controller.refreshToken(req)).rejects.toThrow(UnauthorizedException)
    })

    it('should call authService.refreshToken with correct token', async () => {
      const refreshToken = 'valid-refresh-token'
      const req = {
        cookies: { 'refresh-token': refreshToken }
      }

      const expectedResult = { token: 'new-access-token' }

      jest.spyOn(authService, 'refreshToken').mockResolvedValue(expectedResult)

      const result = await controller.refreshToken(req)

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken)
      expect(result).toEqual(expectedResult)
    })

    it('should handle token refresh errors', async () => {
      const refreshToken = 'invalid-refresh-token'
      const req = {
        cookies: { 'refresh-token': refreshToken }
      }

      const error = new Error('Invalid refresh token')

      jest.spyOn(authService, 'refreshToken').mockRejectedValue(error)

      await expect(controller.refreshToken(req)).rejects.toThrow(error)
    })
  })
})
