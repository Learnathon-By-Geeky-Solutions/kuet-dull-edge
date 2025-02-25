import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { Types } from 'mongoose'
import { AuthService } from '../../../../src/modules/auth/services/auth.service'
import { UserAuthService } from '../../../../src/modules/users/services/user-auth.service'
import { RefreshTokenService } from '../../../../src/modules/auth/services/refreshToken.service'
import { AccountStatus } from '../../../../src/modules/users/schemas/user-auth.schema'
import { UnauthorizedException } from '@nestjs/common'

describe('AuthService', () => {
  let authService: AuthService
  let jwtService: JwtService
  let userAuthService: UserAuthService
  let refreshTokenService: RefreshTokenService

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'signedToken'),
            decode: jest.fn()
          }
        },
        {
          provide: UserAuthService,
          useValue: {
            findByEmailOrUsername: jest.fn(),
            findById: jest.fn()
          }
        },
        {
          provide: RefreshTokenService,
          useValue: {
            generateRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn()
          }
        }
      ]
    }).compile()

    authService = moduleRef.get<AuthService>(AuthService)
    jwtService = moduleRef.get<JwtService>(JwtService)
    userAuthService = moduleRef.get<UserAuthService>(UserAuthService)
    refreshTokenService = moduleRef.get<RefreshTokenService>(RefreshTokenService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  describe('getAnonymousUser', () => {
    it('should return a signed token for an anonymous user', async () => {
      const result = await authService.getAnonymousUser()
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          accountStatus: AccountStatus.ANONYMOUS,
          _id: expect.any(String)
        })
      )
      expect(result).toEqual({ token: 'signedToken' })
    })
  })

  describe('getToken', () => {
    it('should return a signed token with the user ID and account status', () => {
      const userId = new Types.ObjectId()
      const accountStatus = AccountStatus.ACTIVE

      const result = authService.getToken(userId, accountStatus)

      expect(jwtService.sign).toHaveBeenCalledWith({
        _id: userId,
        accountStatus
      })
      expect(result).toBe('signedToken')
    })
  })

  describe('validateUser', () => {
    it('should return token and refresh token for valid credentials', async () => {
      const userId = new Types.ObjectId()
      const mockUser = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE,
        comparePassword: jest.fn().mockResolvedValue(true)
      }

      ;(userAuthService.findByEmailOrUsername as jest.Mock).mockResolvedValue(mockUser)
      ;(refreshTokenService.generateRefreshToken as jest.Mock).mockResolvedValue('refreshToken')

      const result = await authService.validateUser('username', 'password')

      expect(userAuthService.findByEmailOrUsername).toHaveBeenCalledWith('', 'username')
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password')
      expect(jwtService.sign).toHaveBeenCalledWith({ _id: userId, accountStatus: AccountStatus.ACTIVE })
      expect(refreshTokenService.generateRefreshToken).toHaveBeenCalledWith(userId)
      expect(result).toEqual({ token: 'signedToken', refreshToken: 'refreshToken' })
    })

    it('should throw UnauthorizedException if user does not exist', async () => {
      ;(userAuthService.findByEmailOrUsername as jest.Mock).mockResolvedValue(null)

      await expect(authService.validateUser('username', 'password')).rejects.toThrow(
        new UnauthorizedException('INVALID_CREDENTIALS')
      )
    })

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false)
      }

      ;(userAuthService.findByEmailOrUsername as jest.Mock).mockResolvedValue(mockUser)

      await expect(authService.validateUser('username', 'password')).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      )
    })
  })

  describe('oauthEntry', () => {
    it('should return token and refresh token for existing user', async () => {
      const userId = new Types.ObjectId()
      const mockUser = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      }

      ;(userAuthService.findByEmailOrUsername as jest.Mock).mockResolvedValue(mockUser)
      ;(refreshTokenService.generateRefreshToken as jest.Mock).mockResolvedValue('refreshToken')

      const result = await authService.oauthEntry({
        email: 'test@example.com',
        name: 'Test User',
        photo: 'photo.jpg'
      })

      expect(userAuthService.findByEmailOrUsername).toHaveBeenCalledWith('test@example.com', '')
      expect(jwtService.sign).toHaveBeenCalledWith({ _id: userId, accountStatus: AccountStatus.ACTIVE })
      expect(refreshTokenService.generateRefreshToken).toHaveBeenCalledWith(userId)
      expect(result).toEqual({ token: 'signedToken', refreshToken: 'refreshToken' })
    })

    it('should return onboarding token for new user', async () => {
      ;(userAuthService.findByEmailOrUsername as jest.Mock).mockResolvedValue(null)

      const result = await authService.oauthEntry({
        email: 'test@example.com',
        name: 'Test User',
        photo: 'photo.jpg'
      })

      expect(userAuthService.findByEmailOrUsername).toHaveBeenCalledWith('test@example.com', '')
      expect(jwtService.sign).toHaveBeenCalledWith({
        _id: null,
        accountStatus: AccountStatus.ONBOARDING_OAUTH,
        data: { email: 'test@example.com', name: 'Test User', photo: 'photo.jpg' }
      })
      expect(result).toEqual({ token: 'signedToken', refreshToken: null })
    })
  })

  describe('refreshToken', () => {
    it('should return new token if refresh token is valid', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const mockUser = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      }

      ;(jwtService.decode as jest.Mock).mockReturnValue({ userId, rtId })
      ;(userAuthService.findById as jest.Mock).mockResolvedValue(mockUser)
      ;(refreshTokenService.validateRefreshToken as jest.Mock).mockResolvedValue(true)

      const result = await authService.refreshToken('refreshToken')

      expect(jwtService.decode).toHaveBeenCalledWith('refreshToken')
      expect(userAuthService.findById).toHaveBeenCalledWith(userId)
      expect(refreshTokenService.validateRefreshToken).toHaveBeenCalledWith(userId, rtId, 'refreshToken')
      expect(jwtService.sign).toHaveBeenCalledWith({ _id: userId, accountStatus: AccountStatus.ACTIVE })
      expect(result).toEqual({ token: 'signedToken' })
    })

    it('should throw UnauthorizedException if user does not exist', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()

      ;(jwtService.decode as jest.Mock).mockReturnValue({ userId, rtId })
      ;(userAuthService.findById as jest.Mock).mockResolvedValue(null)

      await expect(authService.refreshToken('refreshToken')).rejects.toThrow(
        new UnauthorizedException('INVALID_REFRESH_TOKEN')
      )
    })

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const userId = new Types.ObjectId()
      const rtId = new Types.ObjectId()
      const mockUser = {
        _id: userId,
        accountStatus: AccountStatus.ACTIVE
      }

      ;(jwtService.decode as jest.Mock).mockReturnValue({ userId, rtId })
      ;(userAuthService.findById as jest.Mock).mockResolvedValue(mockUser)
      ;(refreshTokenService.validateRefreshToken as jest.Mock).mockResolvedValue(false)

      await expect(authService.refreshToken('refreshToken')).rejects.toThrow(
        new UnauthorizedException('INVALID_REFRESH_TOKEN')
      )
    })
  })
})
