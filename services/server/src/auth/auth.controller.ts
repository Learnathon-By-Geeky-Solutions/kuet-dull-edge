import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  Version,
  VERSION_NEUTRAL
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { Throttle } from '@nestjs/throttler'
import { AccountStatus } from '../common/enums'
import { AuthGuard } from '@nestjs/passport'
import { GoogleAuthGuard } from '../guards/google.guard'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import {
  EmailVerifyDto,
  LoginDto,
  OAuthOnboardingDto,
  OnboardingDto,
  RegisterDto
} from './dto'
import { TokenResponseDto } from '../common/dto/token-response.dto'
import { EmptyBodyValidationPipe } from '../common/pipes'

import { config } from '../config'
import { LocalAuthGuard } from '../guards/local-auth.guard'
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('Authentication')
@ApiHeader({
  name: 'X-API-Version',
  description: 'API version',
  example: '1'
})
@ApiSecurity('anonymous')
@UseGuards(JwtAuthGuard)
@Throttle({
  default: {
    limit: 5,
    ttl: 3600,
    generateKey: context => context.switchToHttp().getRequest().user.id
  }
})
@ApiResponse({ status: 429, description: 'Too many requests' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Get anonymous user token' })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Returns an anonymous token for unauthenticated operations'
  })
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @UsePipes(EmptyBodyValidationPipe)
  anonymous(): string {
    return this.authService.getAnonymousToken()
  }

  @Post()
  @ApiOperation({ summary: 'Login with username/password' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: String
  })
  @ApiBody({ type: LoginDto, required: true })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: any, @Res() res: any) {
    if (req.userData === undefined || req.userData === false)
      throw new UnauthorizedException('INVALID_CREDENTIALS')
    const { token, refreshToken } = req.userData
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config._.mode === 'production'
    })
    res.json(token)
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    return
  }

  @Get('/google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  @ApiExcludeEndpoint()
  @Version(VERSION_NEUTRAL)
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  async googleLoginCallback(@Request() req: any) {
    const { token } = await this.authService.oauthEntry(req.user)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @Get('github')
  @ApiOperation({ summary: 'Initiate GitHub OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub login' })
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return
  }

  @Get('/github/callback')
  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  @ApiExcludeEndpoint()
  @Version(VERSION_NEUTRAL)
  @UseGuards(AuthGuard('github'))
  @Redirect()
  async githubLoginCallback(@Request() req: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    const { token } = await this.authService.oauthEntry(req.user)
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: String
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ANONYMOUS)
      throw new UnauthorizedException()
    return await this.authService.registerLocal(body)
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 409, description: 'Username/ email taken' })
  @ApiBody({ type: EmailVerifyDto })
  @Throttle({
    default: {
      limit: 4,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  async verifyEmail(@Body() emailVerifyDto: EmailVerifyDto) {
    return this.authService.verifyEmail(emailVerifyDto)
  }

  @Post('resend-email')
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @Throttle({
    default: {
      limit: 1,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UsePipes(EmptyBodyValidationPipe)
  async resendEmail(@Body() body: TokenResponseDto) {
    return this.authService.resendVerificationEmail(body.token)
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Complete user onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding successful',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: OnboardingDto })
  async onboarding(@Body() onboardingDto: OnboardingDto) {
    return this.authService.registerOnboarding(onboardingDto)
  }

  @Post('onboarding/oauth')
  @ApiOperation({ summary: 'Complete OAuth user onboarding' })
  @ApiResponse({
    status: 200,
    description: 'OAuth onboarding successful',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: OAuthOnboardingDto })
  async onboardingOauth(@Body() body: OAuthOnboardingDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ONBOARDING_OAUTH)
      throw new UnauthorizedException()
    return this.authService.registerOnboardingOauth(body, req.user.data)
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  @ApiCookieAuth('refresh-token')
  @UsePipes(EmptyBodyValidationPipe)
  async refreshToken(@Request() req: any) {
    const refreshToken = req.cookies['refresh-token']
    if (!refreshToken) throw new UnauthorizedException()
    return this.authService.refreshToken(refreshToken)
  }
}
