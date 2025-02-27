import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, UnauthorizedException, BadRequestException, HttpException } from '@nestjs/common'
import { JwtAuthGuard, JwtAccountGuard } from '../../../src/modules/auth/guards/jwt-auth.guard'
import { LocalAuthGuard } from '../../../src/modules/auth/guards/local-auth.guard'
import { GoogleAuthGuard } from '../../../src/modules/auth/guards/google.guard'
import { GithubGuard } from '../../../src/modules/auth/guards/github.guard'
import { McaptchaGuard } from '../../../src/modules/auth/guards/captcha.guard'
import { AuthGuard } from '@nestjs/passport'
import { config } from '../../../src/modules/config'
import axios from 'axios'
import { firstValueFrom, Observable, of } from 'rxjs'

// Mock for axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock for config
jest.mock('../../../src/modules/config', () => ({
  config: {
    captchaProvider: 'mcaptcha',
    captchaProviders: {
      mcaptcha: {
        url: 'https://mcaptcha.org/verify',
        key: 'test-key',
        secret: 'test-secret'
      },
      recaptcha: {
        secret: 'recaptcha-secret'
      },
      turnstile: {
        secret: 'turnstile-secret'
      }
    }
  }
}))

describe('Auth Guards', () => {
  // Helper function to create mock execution context
  const createMockExecutionContext = (mockRequest?: object): ExecutionContext => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest || {})
      }),
      getHandler: jest.fn(),
      getClass: jest.fn()
    } as unknown as ExecutionContext
    return mockContext
  }

  // describe('JwtAuthGuard', () => {
  //   let guard: JwtAuthGuard

  //   beforeEach(() => {
  //     guard = new JwtAuthGuard()
  //     // Mock the parent AuthGuard's canActivate method
  //     jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockImplementation(() => true)
  //   })

  //   afterEach(() => {
  //     jest.clearAllMocks()
  //   })

  //   it('should be defined', () => {
  //     expect(guard).toBeDefined()
  //   })

  //   it('should call the parent AuthGuard canActivate method', async () => {
  //     const context = createMockExecutionContext()
  //     const canActivateSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')

  //     await guard.canActivate(context)
  //     expect(canActivateSpy).toHaveBeenCalledWith(context)
  //   })

  //   it('should handle JWT validation failure', async () => {
  //     const context = createMockExecutionContext()
  //     jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockImplementation(() => {
  //       throw new UnauthorizedException('Invalid token')
  //     })

  //     await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  //   })

  //   it('should handle JWT expiration', async () => {
  //     const context = createMockExecutionContext()
  //     jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockImplementation(() => {
  //       throw new UnauthorizedException('jwt expired')
  //     })

  //     await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  //   })
  // })

  describe('JwtAccountGuard', () => {
    let guard: JwtAccountGuard

    beforeEach(() => {
      guard = new JwtAccountGuard()
      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(AuthGuard('jwt-account').prototype, 'canActivate').mockImplementation(() => true)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should be defined', () => {
      expect(guard).toBeDefined()
    })

    it('should call the parent AuthGuard canActivate method', async () => {
      const context = createMockExecutionContext()
      const canActivateSpy = jest.spyOn(AuthGuard('jwt-account').prototype, 'canActivate')

      await guard.canActivate(context)
      expect(canActivateSpy).toHaveBeenCalledWith(context)
    })
  })

  // describe('LocalAuthGuard', () => {
  //   let guard: LocalAuthGuard

  //   beforeEach(() => {
  //     guard = new LocalAuthGuard()
  //     // Mock the parent AuthGuard's canActivate method
  //     jest.spyOn(AuthGuard('\\local').prototype, 'canActivate').mockImplementation(() => true)
  //   })

  //   afterEach(() => {
  //     jest.clearAllMocks()
  //   })

  //   it('should be defined', () => {
  //     expect(guard).toBeDefined()
  //   })

  //   it('should handle valid request body', async () => {
  //     const validRequest = {
  //       body: {
  //         username: 'testuser',
  //         password: 'password123'
  //       }
  //     }
  //     const context = createMockExecutionContext(validRequest)

  //     const result = await guard.canActivate(context)
  //     expect(result).toBe(true)
  //   })

  //   it('should throw BadRequestException when request body is invalid', async () => {
  //     const invalidRequest = {
  //       body: {
  //         // Missing password field
  //         username: 'testuser'
  //       }
  //     }
  //     const context = createMockExecutionContext(invalidRequest)

  //     await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException)
  //   })

  //   it('should throw BadRequestException when username field is empty', async () => {
  //     const invalidRequest = {
  //       body: {
  //         username: '',
  //         password: 'password123'
  //       }
  //     }
  //     const context = createMockExecutionContext(invalidRequest)

  //     await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException)
  //   })

  //   it('should throw BadRequestException when password field is empty', async () => {
  //     const invalidRequest = {
  //       body: {
  //         username: 'testuser',
  //         password: ''
  //       }
  //     }
  //     const context = createMockExecutionContext(invalidRequest)

  //     await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException)
  //   })

  //   it('should handle canActivate returning an Observable', async () => {
  //     const validRequest = {
  //       body: {
  //         username: 'testuser',
  //         password: 'password123'
  //       }
  //     }
  //     const context = createMockExecutionContext(validRequest)

  //     jest.spyOn(AuthGuard('\\local').prototype, 'canActivate').mockImplementation(() => {
  //       return of(true) as unknown as boolean | Promise<boolean> | Observable<boolean>
  //     })

  //     const result = await guard.canActivate(context)
  //     expect(result).toBe(true)
  //   })

  //   it('should call handleRequest and attach userData to request', () => {
  //     const mockUser = { id: '123', username: 'testuser' }
  //     const mockRequest = {}
  //     const context = createMockExecutionContext(mockRequest)

  //     const result = guard.handleRequest(null, mockUser, null, context)

  //     expect(result).toBe(mockUser)
  //     expect(mockRequest).toHaveProperty('userData', mockUser)
  //   })
  // })

  describe('GoogleAuthGuard', () => {
    let guard: GoogleAuthGuard

    beforeEach(() => {
      guard = new GoogleAuthGuard()
      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(AuthGuard('google').prototype, 'canActivate').mockImplementation(() => true)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should be defined', () => {
      expect(guard).toBeDefined()
    })

    it('should call the parent AuthGuard canActivate method', async () => {
      const context = createMockExecutionContext()
      const canActivateSpy = jest.spyOn(AuthGuard('google').prototype, 'canActivate')

      await guard.canActivate(context)
      expect(canActivateSpy).toHaveBeenCalledWith(context)
    })

    it('should attach userData to request in handleRequest', () => {
      const mockUser = {
        email: 'user@example.com',
        name: 'Test User',
        photo: 'http://example.com/photo.jpg'
      }
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      const result = guard.handleRequest(null, mockUser, null, context)

      expect(result).toBe(mockUser)
      expect(mockRequest).toHaveProperty('userData', mockUser)
    })

    it('should handle null user in handleRequest', () => {
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      const result = guard.handleRequest(null, null, null, context)

      expect(result).toBeNull()
      expect(mockRequest).toHaveProperty('userData', null)
    })

    it('should handle error in handleRequest', () => {
      const mockError = new Error('OAuth error')
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      // This should not throw as we're not checking errors in handleRequest
      const result = guard.handleRequest(mockError, null, null, context)

      expect(result).toBeNull()
      expect(mockRequest).toHaveProperty('userData', null)
    })
  })

  describe('GithubGuard', () => {
    let guard: GithubGuard

    beforeEach(() => {
      guard = new GithubGuard()
      // Mock the parent AuthGuard's canActivate method
      jest.spyOn(AuthGuard('github').prototype, 'canActivate').mockImplementation(() => true)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should be defined', () => {
      expect(guard).toBeDefined()
    })

    it('should call the parent AuthGuard canActivate method', async () => {
      const context = createMockExecutionContext()
      const canActivateSpy = jest.spyOn(AuthGuard('github').prototype, 'canActivate')

      await guard.canActivate(context)
      expect(canActivateSpy).toHaveBeenCalledWith(context)
    })

    it('should attach userData to request in handleRequest', () => {
      const mockUser = {
        name: 'Test User',
        email: 'user@example.com',
        picture: 'http://example.com/photo.jpg'
      }
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      const result = guard.handleRequest(null, mockUser, null, context)

      expect(result).toBe(mockUser)
      expect(mockRequest).toHaveProperty('userData', mockUser)
    })

    it('should handle null user in handleRequest', () => {
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      const result = guard.handleRequest(null, null, null, context)

      expect(result).toBeNull()
      expect(mockRequest).toHaveProperty('userData', null)
    })

    it('should handle error in handleRequest', () => {
      const mockError = new Error('OAuth error')
      const mockRequest = {}
      const context = createMockExecutionContext(mockRequest)

      // This should not throw as we're not checking errors in handleRequest
      const result = guard.handleRequest(mockError, null, null, context)

      expect(result).toBeNull()
      expect(mockRequest).toHaveProperty('userData', null)
    })
  })

  // describe('McaptchaGuard', () => {
  //   let guard: McaptchaGuard

  //   beforeEach(() => {
  //     // Reset axios mock
  //     mockedAxios.post.mockReset()
  //   })

  //   afterEach(() => {
  //     jest.clearAllMocks()
  //   })

  //   it('should be defined', () => {
  //     guard = new McaptchaGuard(true)
  //     expect(guard).toBeDefined()
  //   })

  //   it('should bypass captcha verification when disabled', async () => {
  //     guard = new McaptchaGuard(false)
  //     const context = createMockExecutionContext()

  //     const result = await guard.canActivate(context)
  //     expect(result).toBe(true)
  //     expect(mockedAxios.post).not.toHaveBeenCalled()
  //   })

  //   // it('should verify valid mcaptcha token', async () => {
  //   //     guard = new McaptchaGuard(true)
  //   //     const mockRequest = {
  //   //         headers: {
  //   //             'x-captcha-token': 'valid-token'
  //   //         }
  //   //     }
  //   //     const context = createMockExecutionContext(mockRequest)

  //   //     mockedAxios.post.mockResolvedValueOnce({
  //   //         status: 200,
  //   //         data: { valid: true }
  //   //     })

  //   //     const result = await guard.canActivate(context)

  //   //     expect(result).toBe(true)
  //   //     expect(mockedAxios.post).toHaveBeenCalledWith(
  //   //         config.captchaProviders.mcaptcha.url,
  //   //         {
  //   //             token: 'valid-token',
  //   //             key: config.captchaProviders.mcaptcha.key,
  //   //             secret: config.captchaProviders.mcaptcha.secret
  //   //         }
  //   //     )
  //   // })

  //   // it('should throw HttpException when mcaptcha verification fails', async () => {
  //   //     guard = new McaptchaGuard(true)
  //   //     const mockRequest = {
  //   //         headers: {
  //   //             'x-captcha-token': 'invalid-token'
  //   //         }
  //   //     }
  //   //     const context = createMockExecutionContext(mockRequest)

  //   //     mockedAxios.post.mockResolvedValueOnce({
  //   //         status: 200,
  //   //         data: { valid: false }
  //   //     })

  //   //     await expect(guard.canActivate(context)).rejects.toThrow(new HttpException('CAPTCHA_FAILED', 400))
  //   // })

  //   // it('should throw HttpException with 502 when mcaptcha server returns non-200', async () => {
  //   //     guard = new McaptchaGuard(true)
  //   //     const mockRequest = {
  //   //         headers: {
  //   //             'x-captcha-token': 'any-token'
  //   //         }
  //   //     }
  //   //     const context = createMockExecutionContext(mockRequest)

  //   //     mockedAxios.post.mockResolvedValueOnce({
  //   //         status: 500,
  //   //         data: null
  //   //     })

  //   //     await expect(guard.canActivate(context)).rejects.toThrow(new HttpException('C_ERR', 502))
  //   // })

  //   // it('should throw HttpException with 502 when mcaptcha response has no data', async () => {
  //   //     guard = new McaptchaGuard(true)
  //   //     const mockRequest = {
  //   //         headers: {
  //   //             'x-captcha-token': 'any-token'
  //   //         }
  //   //     }
  //   //     const context = createMockExecutionContext(mockRequest)

  //   //     mockedAxios.post.mockResolvedValueOnce({
  //   //         status: 200,
  //   //         data: null
  //   //     })

  //   //     await expect(guard.canActivate(context)).rejects.toThrow(new HttpException('C_ERR', 502))
  //   // })

  //   it('should handle network errors during captcha verification', async () => {
  //     guard = new McaptchaGuard(true)
  //     const mockRequest = {
  //       headers: {
  //         'x-captcha-token': 'any-token'
  //       }
  //     }
  //     const context = createMockExecutionContext(mockRequest)

  //     mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

  //     await expect(guard.canActivate(context)).rejects.toThrow(Error)
  //   })

  //   it('should bypass verification for non-mcaptcha providers (to be implemented)', async () => {
  //     // Update the mock to use a different captcha provider
  //     jest.mock('../../../src/modules/config', () => ({
  //       config: {
  //         captchaProvider: 'recaptcha',
  //         captchaProviders: {
  //           mcaptcha: {
  //             url: 'https://mcaptcha.org/verify',
  //             key: 'test-key',
  //             secret: 'test-secret'
  //           },
  //           recaptcha: {
  //             secret: 'recaptcha-secret'
  //           }
  //         }
  //       }
  //     }))

  //     guard = new McaptchaGuard(true)
  //     const context = createMockExecutionContext()

  //     // This should pass because other providers are not implemented yet
  //     const result = await guard.canActivate(context)
  //     expect(result).toBe(true)
  //   })

  //   // it('should handle missing x-captcha-token header', async () => {
  //   //   guard = new McaptchaGuard(true)
  //   //   const mockRequest = {
  //   //     headers: {}
  //   //   }
  //   //   const context = createMockExecutionContext(mockRequest)

  //   //   mockedAxios.post.mockResolvedValueOnce({
  //   //     status: 200,
  //   //     data: { valid: false }
  //   //   })

  //   //   await expect(guard.canActivate(context)).rejects.toThrow(HttpException)
  //   //   expect(mockedAxios.post).toHaveBeenCalledWith(
  //   //     config.captchaProviders.mcaptcha.url,
  //   //     expect.objectContaining({
  //   //       token: undefined
  //   //     })
  //   //   )
  //   // })
  // })
})
