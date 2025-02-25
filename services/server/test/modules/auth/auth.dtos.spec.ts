import { validate } from 'class-validator'
import { RegisterDto } from '../../../src/modules/auth/dto/register.dto'
import { LoginDto } from '../../../src/modules/auth/dto/login.dto'
import { OnboardingDto } from '../../../src/modules/auth/dto/onboarding.dto'
import { EmailVerifyDto } from '../../../src/modules/auth/dto/email-verify.dto'
import { OAuthOnboardingDto } from '../../../src/modules/auth/dto/oauth-onboarding.dto'
import { UsernameCheckDto } from '../../../src/modules/auth/dto/username-check.dto'
import { plainToInstance } from 'class-transformer'

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'testuser',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when username is missing', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when password is missing', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'testuser'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when username is not a string', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 123,
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when password is not a string', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'testuser',
        password: 12345
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when username is an empty string', async () => {
      const dto = plainToInstance(LoginDto, {
        username: '',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when password is an empty string', async () => {
      const dto = plainToInstance(LoginDto, {
        username: 'testuser',
        password: ''
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })
  })

  describe('RegisterDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when username is too short', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'te',
        email: 'test@example.com',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username is too long', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'thisusernameiswaytoolongtobevalid1234567',
        email: 'test@example.com',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username contains invalid characters', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'test-user@',
        email: 'test@example.com',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when email is invalid', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('email')
    })

    it('should fail validation when email is too short', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'a@b.c',
        password: 'Password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('email')
    })

    it('should fail validation when password is too short', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Pass1!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when password is too long', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'.repeat(7)
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when password does not contain uppercase letter', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when password does not contain lowercase letter', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'PASSWORD123!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when password does not contain a number', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password!!!'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })

    it('should fail validation when password does not contain a special character', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('password')
    })
  })

  describe('OnboardingDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when name is missing', async () => {
      const dto = plainToInstance(OnboardingDto, {
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('name')
    })

    it('should fail validation when name is too short', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'A',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('name')
    })

    it('should fail validation when name is too long', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'A'.repeat(51),
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('name')
    })

    it('should fail validation when birthday is missing', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('birthday')
    })

    it('should fail validation when birthday has invalid format', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '01/01/1990',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('birthday')
    })

    it('should fail validation when institute is missing', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('institute')
    })

    it('should fail validation when institute is too short', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'A',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('institute')
    })

    it('should fail validation when instituteIdentifier is missing', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('instituteIdentifier')
    })

    it('should fail validation when instituteIdentifier is too short', async () => {
      const dto = plainToInstance(OnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: 'A'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('instituteIdentifier')
    })
  })

  describe('EmailVerifyDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: '123456'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when verificationCode is missing', async () => {
      const dto = plainToInstance(EmailVerifyDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('verificationCode')
    })

    it('should fail validation when verificationCode is too short', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('verificationCode')
    })

    it('should fail validation when verificationCode is too long', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: '12345678901'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('verificationCode')
    })

    it('should fail validation when verificationCode is not a string', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: 123456
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('verificationCode')
    })

    // Edge case: should pass when verificationCode is exactly 6 characters
    it('should pass validation when verificationCode is exactly 6 characters', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: '123456'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    // Edge case: should pass when verificationCode is exactly 10 characters
    it('should pass validation when verificationCode is exactly 10 characters', async () => {
      const dto = plainToInstance(EmailVerifyDto, {
        verificationCode: '1234567890'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })

  describe('OAuthOnboardingDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        username: 'testuser',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when username is missing', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username is too short', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        username: 'te',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username is too long', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        username: 'a'.repeat(21),
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username contains invalid characters', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        username: 'user@name-invalid',
        name: 'Test User',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    // Inherits validation from OnboardingDto
    it('should fail validation when name is missing (inherited validation)', async () => {
      const dto = plainToInstance(OAuthOnboardingDto, {
        username: 'testuser',
        birthday: '1990-01-01',
        institute: 'Test Institute',
        instituteIdentifier: '12345'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('name')
    })
  })

  describe('UsernameCheckDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'testuser'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should fail validation when username is missing', async () => {
      const dto = plainToInstance(UsernameCheckDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username is too short', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'ab'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username is too long', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'a'.repeat(21)
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username contains invalid characters', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'user-with-hyphens'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username contains spaces', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'user with spaces'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should fail validation when username contains special characters', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'user@name'
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].property).toBe('username')
    })

    it('should pass validation when username contains periods', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'test.user'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should pass validation when username contains underscores', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'test_user'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should pass validation when username contains alphanumeric characters', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'test123user'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should pass validation when username is exactly 3 characters', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'abc'
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('should pass validation when username is exactly 20 characters', async () => {
      const dto = plainToInstance(UsernameCheckDto, {
        username: 'a'.repeat(20)
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })
  })
})
