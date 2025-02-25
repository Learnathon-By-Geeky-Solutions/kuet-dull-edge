import { Test, TestingModule } from '@nestjs/testing'
import { GoogleStrategy } from '../../../../src/modules/auth/strategies/google.strategy'
import { config } from '../../../../src/modules/config'

jest.mock('../../../../src/modules/config', () => ({
  config: {
    _: {
      base_url: 'http://localhost:3000'
    },
    authProviders: {
      google: {
        oauthClientId: 'test-client-id',
        oauthClientSecret: 'test-client-secret'
      }
    }
  }
}))

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleStrategy]
    }).compile()

    strategy = module.get<GoogleStrategy>(GoogleStrategy)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  describe('validate', () => {
    it('should correctly map the Google profile to a user object', async () => {
      // Mock Google profile data
      const mockProfile = {
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://example.com/photo.jpg' }]
      }

      // Mock callback function
      const doneFn = jest.fn()

      // Call validate method
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      // Assert callback was called with correct user object
      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg'
      })
    })

    it('should handle profiles with missing email', async () => {
      const mockProfile = {
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
        emails: [],
        photos: [{ value: 'https://example.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: undefined,
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg'
      })
    })

    it('should handle profiles with missing photos', async () => {
      const mockProfile = {
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
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

    it('should handle profiles with missing name', async () => {
      const mockProfile = {
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://example.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'undefined undefined',
        picture: 'https://example.com/photo.jpg'
      })
    })

    it('should handle profiles with empty name fields', async () => {
      const mockProfile = {
        name: {
          givenName: '',
          familyName: ''
        },
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://example.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: ' ',
        picture: 'https://example.com/photo.jpg'
      })
    })

    it('should handle profiles with multiple emails and use the first one', async () => {
      const mockProfile = {
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
        emails: [{ value: 'primary@example.com' }, { value: 'secondary@example.com' }],
        photos: [{ value: 'https://example.com/photo.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'primary@example.com',
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg'
      })
    })

    it('should handle profiles with multiple photos and use the first one', async () => {
      const mockProfile = {
        name: {
          givenName: 'John',
          familyName: 'Doe'
        },
        emails: [{ value: 'john.doe@example.com' }],
        photos: [{ value: 'https://example.com/photo1.jpg' }, { value: 'https://example.com/photo2.jpg' }]
      }

      const doneFn = jest.fn()
      await strategy.validate('mock-token', 'mock-refresh-token', mockProfile, doneFn)

      expect(doneFn).toHaveBeenCalledWith(null, {
        email: 'john.doe@example.com',
        name: 'John Doe',
        picture: 'https://example.com/photo1.jpg'
      })
    })
  })
})
