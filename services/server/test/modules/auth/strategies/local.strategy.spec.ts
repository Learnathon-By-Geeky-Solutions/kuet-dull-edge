import { Test, TestingModule } from '@nestjs/testing'
import { LocalStrategy } from '../../../../src/modules/auth/strategies/local.strategy'
import { AuthService } from '../../../../src/modules/auth/auth.service'
import { UnauthorizedException } from '@nestjs/common'

describe('LocalStrategy', () => {
  let strategy: LocalStrategy
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn()
          }
        }
      ]
    }).compile()

    strategy = module.get<LocalStrategy>(LocalStrategy)
    authService = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should call authService.validateUser with correct credentials', async () => {
      const email = 'test@example.com'
      const password = 'password123'
      const mockUser = { id: '1', email }

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser)

      const result = await strategy.validate(email, password)

      expect(authService.validateUser).toHaveBeenCalledWith(email, password)
      expect(result).toEqual(mockUser)
    })

    it('should return user when validation succeeds', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser)

      const result = await strategy.validate('test@example.com', 'password123')
      expect(result).toEqual(mockUser)
    })

    it('should handle when authService.validateUser returns null', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null)

      const promise = strategy.validate('invalid@example.com', 'wrong-password')
      await expect(promise).resolves.toBeNull()
      expect(authService.validateUser).toHaveBeenCalledWith('invalid@example.com', 'wrong-password')
    })

    it('should propagate errors from authService.validateUser', async () => {
      const error = new UnauthorizedException('Invalid credentials')
      jest.spyOn(authService, 'validateUser').mockRejectedValue(error)

      await expect(strategy.validate('test@example.com', 'password')).rejects.toThrow(error)
    })

    it('should handle empty email and password', async () => {
      await strategy.validate('', '')
      expect(authService.validateUser).toHaveBeenCalledWith('', '')
    })

    it('should handle special characters in email', async () => {
      const email = 'test+special@example.com'
      await strategy.validate(email, 'password')
      expect(authService.validateUser).toHaveBeenCalledWith(email, 'password')
    })
  })
})
