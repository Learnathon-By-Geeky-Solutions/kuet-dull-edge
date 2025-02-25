import { Test, TestingModule } from '@nestjs/testing'
import { GitHubStrategy } from '../../../../src/modules/auth/strategies/github.strategy'
import { config } from '../../../../src/modules/config'

jest.mock('../../../../src/modules/config', () => ({
  config: {
    _: {
      base_url: 'http://localhost:3000'
    },
    authProviders: {
      github: {
        oauthClientId: 'test-github-client-id',
        oauthClientSecret: 'test-github-client-secret'
      }
    }
  }
}))

describe('GitHubStrategy', () => {
  let strategy: GitHubStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitHubStrategy]
    }).compile()

    strategy = module.get<GitHubStrategy>(GitHubStrategy)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should correctly map the GitHub profile to a user object', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://github.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'John Doe',
        picture: 'https://github.com/photo.jpg'
      })
    })

    it('should handle profiles with missing email', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [],
        photos: [{ value: 'https://github.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: undefined,
        name: 'John Doe',
        picture: 'https://github.com/photo.jpg'
      })
    })

    it('should handle profiles with missing photos', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [{ value: 'john.doe@example.com' }],
        photos: []
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'John Doe',
        picture: undefined
      })
    })

    it('should handle profiles with no displayName', async () => {
      const mockProfile = {
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://github.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: undefined,
        picture: 'https://github.com/photo.jpg'
      })
    })

    it('should handle profiles with multiple emails and use the first one', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [{ value: 'primary@example.com' }, { value: 'secondary@example.com' }],
        photos: [{ value: 'https://github.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'primary@example.com',
        name: 'John Doe',
        picture: 'https://github.com/photo.jpg'
      })
    })

    it('should handle profiles with multiple photos and use the first one', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://github.com/photo1.jpg' }, { value: 'https://github.com/photo2.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'John Doe',
        picture: 'https://github.com/photo1.jpg'
      })
    })

    it('should handle private emails with null value', async () => {
      const mockProfile = {
        displayName: 'John Doe',
        emails: [{ value: null }],
        photos: [{ value: 'https://github.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: null,
        name: 'John Doe',
        picture: 'https://github.com/photo.jpg'
      })
    })
  })
})
