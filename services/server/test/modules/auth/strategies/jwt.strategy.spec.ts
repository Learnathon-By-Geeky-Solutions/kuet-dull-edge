import { Test, TestingModule } from '@nestjs/testing'
import { JwtStrategy, JwtRefreshStrategy } from '../../../../src/modules/auth/strategies/jwt.strategy'
import { UnauthorizedException } from '@nestjs/common'
import { AccountStatus } from '../../../../src/modules/users/repository/user-auth.schema'
import { Types } from 'mongoose'

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

describe('JwtRefreshStrategy', () => {
  let refreshStrategy: JwtRefreshStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRefreshStrategy]
    }).compile()

    refreshStrategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy)
  })

  it('should be defined', () => {
    expect(refreshStrategy).toBeDefined()
  })

  describe('validate', () => {
    it('should return payload when account status is ACTIVE', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: AccountStatus.ACTIVE
      }
      await expect(refreshStrategy.validate(payload)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException when account status is ACTIVE', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: AccountStatus.ACTIVE
      }
      await expect(refreshStrategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('INVALID_ACCOUNT_STATUS')
      )
    })

    it('should pass when account status is not ACTIVE', async () => {
      const nonActiveStatuses = Object.values(AccountStatus).filter(status => status !== AccountStatus.ACTIVE)

      for (const status of nonActiveStatuses) {
        const payload = {
          _id: new Types.ObjectId().toString(),
          accountStatus: status
        }
        const result = await refreshStrategy.validate(payload)
        expect(result).toEqual(payload)
      }
    })

    it('should handle payload with missing account status', async () => {
      const payload = {
        _id: new Types.ObjectId().toString()
      }
      const result = await refreshStrategy.validate(payload)
      expect(result).toEqual(payload)
    })

    it('should handle payload with null or undefined account status', async () => {
      const payloadWithNull = {
        _id: new Types.ObjectId().toString(),
        accountStatus: null
      }
      const resultNull = await refreshStrategy.validate(payloadWithNull)
      expect(resultNull).toEqual(payloadWithNull)

      const payloadWithUndefined = {
        _id: new Types.ObjectId().toString(),
        accountStatus: undefined
      }
      const resultUndefined = await refreshStrategy.validate(payloadWithUndefined)
      expect(resultUndefined).toEqual(payloadWithUndefined)
    })

    it('should handle payload with invalid account status value', async () => {
      const payload = {
        _id: new Types.ObjectId().toString(),
        accountStatus: 'INVALID_STATUS'
      }
      const result = await refreshStrategy.validate(payload)
      expect(result).toEqual(payload)
    })
  })
})
