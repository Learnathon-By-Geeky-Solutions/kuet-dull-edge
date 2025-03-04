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
import { LoginDto, RegisterDto, OnboardingDto, OAuthOnboardingDto, TokenResponseDto, EmailVerifyDto } from './auth.dto'
import { Throttle } from '@nestjs/throttler'
import { EmptyBodyValidationPipe } from '../common/pipes/emptyBody'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { AuthGuard } from '@nestjs/passport'
import { AccountStatus, MFAType } from '../../interfaces/users.interfaces'
import { GoogleAuthGuard } from '../../guards/google.guard'

import { config } from '../config'
import { LocalAuthGuard } from '../../guards/local-auth.guard'
import { Types } from 'mongoose'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiHeader
} from '@nestjs/swagger'

@ApiTags('Authentication')
@ApiHeader({
  name: 'x-api-version',
  required: true
})
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Get anonymous user token' })
  @ApiResponse({ status: 200, description: 'Returns an anonymous token for unauthenticated operations' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @UsePipes(EmptyBodyValidationPipe)
  async anonymous(@Body() body: undefined) {
    return this.authService.getAnonymousToken()
  }

  @Post()
  @ApiOperation({ summary: 'Login with username/password' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: TokenResponseDto
  })
  @ApiBody({ type: LoginDto, required: true })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBearerAuth()
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UseGuards(LocalAuthGuard)
  @UseGuards(JwtAuthGuard)
  async login(@Request() req: any, @Res() res: any) {
    if (req.userData === undefined) throw new UnauthorizedException('INVALID_CREDENTIALS')
    const { token, refreshToken } = req.userData
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config._.mode === 'production'
    })
    res.json({ token })
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBearerAuth()
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UseGuards(GoogleAuthGuard)
  @UseGuards(JwtAuthGuard)
  async googleLogin() {
    return
  }

  @Get('/google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  @ApiExcludeEndpoint() // Excluding from Swagger as it's a callback endpoint
  @Version(VERSION_NEUTRAL)
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  async googleLoginCallback(@Request() req: any) {
    const { token } = await this.authService.oauthEntry(req.user)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @ApiOperation({ summary: 'Initiate GitHub OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub login' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBearerAuth()
  @Get('github')
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UseGuards(AuthGuard('github'))
  @UseGuards(JwtAuthGuard)
  async githubLogin() {
    return
  }

  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  @ApiExcludeEndpoint()
  @Version(VERSION_NEUTRAL)
  @Get('/github/callback')
  @UseGuards(AuthGuard('github'))
  @Redirect()
  async githubLoginCallback(@Request() req: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    const { token } = await this.authService.oauthEntry(req.user)
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: TokenResponseDto
  })
  @Post('register')
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBody({ type: RegisterDto })
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  async register(@Body() body: RegisterDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ANONYMOUS) throw new UnauthorizedException()
    return await this.authService.registerLocal(body)
  }

  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username/ email taken' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBody({ type: EmailVerifyDto })
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      limit: 4,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Post('verify-email')
  async verifyEmail(@Body() emailVerifyDto: EmailVerifyDto, @Request() req: any) {
    return this.authService.verifyEmail(emailVerifyDto)
  }

  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      limit: 1,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Post('resend-email')
  @UsePipes(EmptyBodyValidationPipe)
  async resendEmail(@Body() body: TokenResponseDto) {
    return this.authService.resendVerificationEmail(body.token)
  }

  @ApiOperation({ summary: 'Complete user onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding successful',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: OnboardingDto })
  @ApiBearerAuth()
  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  async onboarding(@Body() onboardingDto: OnboardingDto) {
    return this.authService.registerOnboarding(onboardingDto)
  }

  @ApiOperation({ summary: 'Complete OAuth user onboarding' })
  @ApiResponse({
    status: 200,
    description: 'OAuth onboarding successful',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: OAuthOnboardingDto })
  @ApiBearerAuth()
  @Post('onboarding/oauth')
  @UseGuards(JwtAuthGuard)
  async onboardingOauth(@Body() body: OAuthOnboardingDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ONBOARDING_OAUTH) throw new UnauthorizedException()
    return this.authService.registerOnboardingOauth(body, req.user.data)
  }

  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  @ApiCookieAuth('refresh-token')
  @Post('refresh-token')
  @UsePipes(EmptyBodyValidationPipe)
  async refreshToken(@Request() req: any) {
    const refreshToken = req.cookies['refresh-token']
    if (!refreshToken) throw new UnauthorizedException()
    return this.authService.refreshToken(refreshToken)
  }
  // }
  // @ApiOperation({ summary: 'Setup Multi-Factor Authentication' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'MFA setup initiated',
  //   type: MFASetupResponseDto
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBody({ type: MFASetupDto })
  // @ApiBearerAuth()
  // @Post('mfa/setup')
  // @Post('mfa/setup')
  // @UseGuards(JwtAuthGuard)
  // async setupMFA(@Body() mfaSetupDto: MFASetupDto, @Request() req: any) {
  //   if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
  //   return this.authService.setupMFA(req.user._id, mfaSetupDto.type as MFAType)
  // }

  // //TODO: Use specific guard for active accounts
  // @ApiOperation({ summary: 'Verify and enable MFA' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'MFA enabled',
  //   type: MFAVerifyResponseDto
  // })
  // @ApiResponse({ status: 400, description: 'Invalid code or MFA setup' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBody({ type: MFAVerifyDto })
  // @ApiBearerAuth()
  // @Post('mfa/verify')
  // @UseGuards(JwtAuthGuard)
  // async verifyAndEnableMFA(@Body() mfaVerifyDto: MFAVerifyDto, @Request() req: any) {
  //   if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()

  //   return this.authService.verifyAndEnableMFA(req.user._id, mfaVerifyDto.code, new Types.ObjectId(mfaVerifyDto.mfaId))
  // }

  // @ApiOperation({ summary: 'Get MFA status' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'MFA status retrieved',
  //   type: MFAStatusResponseDto
  // })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBearerAuth()
  // @Get('mfa/status')
  // @UseGuards(JwtAuthGuard)
  // async getMFAStatus(@Request() req: any) {
  //   if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
  //   const mfaList = await this.authService.getMFAStatus(req.user._id)
  //   return { mfaList }
  // }

  // @ApiOperation({ summary: 'Disable MFA' })
  // @ApiResponse({ status: 200, description: 'MFA disabled' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBearerAuth()
  // @Post('mfa/disable')
  // @UsePipes(EmptyBodyValidationPipe)
  // @UseGuards(JwtAuthGuard)
  // async disableMFA(@Body() body: undefined, @Request() req: any) {
  //   if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException() // TODO: use specific guard for active accounts
  //   await this.authService.disableMFA(req.user._id)
  //   return { success: true }
  // }

  // @ApiOperation({ summary: 'Use recovery code' })
  // @ApiResponse({ status: 200, description: 'Recovery code validated' })
  // @ApiResponse({ status: 400, description: 'Invalid recovery code' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiBody({ type: MFARecoveryDto })
  // @ApiBearerAuth()
  // @Post('mfa/recovery')
  // @UseGuards(JwtAuthGuard)
  // async validateRecoveryCode(@Body() mfaRecoveryDto: MFARecoveryDto, @Request() req: any) {
  //   const isValid = await this.authService.validateRecoveryCode(req.user._id, mfaRecoveryDto.code)
  //   if (!isValid) throw new UnauthorizedException('Invalid recovery code')
  //   return { success: true }
  // }
}
