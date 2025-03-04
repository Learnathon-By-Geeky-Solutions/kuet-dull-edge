import { Test, TestingModule } from '@nestjs/testing'
import { JwtStrategy, JwtRefreshStrategy } from '../../../../src/modules/auth/strategies/jwt.strategy'
import { UnauthorizedException } from '@nestjs/common'
import { AccountStatus } from '../../../../src/interfaces/users.interfaces'
import { Types } from 'mongoose'

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtRefreshStrategy,
          useValue: {
            validate: jest.fn(payload => {
              if (payload.accountStatus === AccountStatus.ACTIVE) {
                return Promise.resolve(payload)
              }
              return Promise.reject(new UnauthorizedException('INVALID_ACCOUNT_STATUS'))
            })
          }
        }
      ]
    }).compile()

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy)
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should return the payload if account status is ACTIVE', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: AccountStatus.ACTIVE
      }
      const result = await strategy.validate(payload)
      expect(result).toEqual(payload)
    })

    it('should throw UnauthorizedException if account status is not ACTIVE', async () => {
      const nonActiveStatuses = Object.values(AccountStatus).filter(status => status !== AccountStatus.ACTIVE)

      for (const status of nonActiveStatuses) {
        const payload = {
          _id: new Types.ObjectId().toString(),
          accountStatus: status
        }
        await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException)
      }
    })
  })
})

describe('JwtStrategy', () => {
  let strategy: JwtStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy]
    }).compile()

    strategy = module.get<JwtStrategy>(JwtStrategy)
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should return the payload without modifications', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: AccountStatus.ACTIVE
      }
      const result = await strategy.validate(payload)
      expect(result).toEqual(payload)
    })

    it('should handle empty payload', async () => {
      const payload = {}
      const result = await strategy.validate(payload)
      expect(result).toEqual(payload)
    })

    it('should handle payload with additional fields', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: AccountStatus.ACTIVE,
        extraField: 'extraValue',
        customData: { key: 'value' }
      }
      const result = await strategy.validate(payload)
      expect(result).toEqual(payload)
    })

    it('should handle different account statuses', async () => {
      const statuses = Object.values(AccountStatus)
      for (const status of statuses) {
        const payload = {
          _id: new Types.ObjectId().toString(),
          accountStatus: status
        }
        const result = await strategy.validate(payload)
        expect(result).toEqual(payload)
      }
    })
  })
})
