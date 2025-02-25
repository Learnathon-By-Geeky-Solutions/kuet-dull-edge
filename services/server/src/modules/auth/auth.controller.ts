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
import { RegistrationService } from './services/registration.service'
import { AuthService } from './services/auth.service'
import { RegisterDto } from './dto/register.dto'
import { EmailVerifyDto } from './dto/email-verify.dto'
import { OnboardingDto } from './dto/onboarding.dto'
import { Throttle } from '@nestjs/throttler'
import { EmptyBodyValidationPipe } from '../../common/pipes/emptyBody'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AuthGuard } from '@nestjs/passport'
import { AccountStatus } from '../users/schemas/user-auth.schema'
import { GoogleAuthGuard } from './guards/google.guard'
import { OAuthOnboardingDto } from './dto/oauth-onboarding.dto'
import { config } from '../config'
import { LocalAuthGuard } from './guards/local-auth.guard'

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  // TODO : Load throttle config from config file -for all
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @Get()
  @UsePipes(EmptyBodyValidationPipe)
  async anonymous(@Body() body: undefined) {
    return this.authService.getAnonymousUser()
  }

  @Post()
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UseGuards(JwtAuthGuard)
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: any, @Res() res: any) {
    if (req.userData === undefined)
      throw new UnauthorizedException('INVALID_CREDENTIALS')
    const { token, refreshToken } = req.userData
    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config._.mode === 'production'
    })
    res.json({ token })
    // TODO : check MFA
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Get('google')
  @UseGuards(JwtAuthGuard)
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    return
  }

  @Version(VERSION_NEUTRAL)
  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  async googleLoginCallback(@Request() req: any) {
    const { token } = await this.authService.oauthEntry(req.user)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @Get('github')
  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @UseGuards(JwtAuthGuard)
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return
  }

  @Version(VERSION_NEUTRAL)
  @Get('/github/callback')
  @UseGuards(AuthGuard('github'))
  @Redirect()
  async githubLoginCallback(@Request() req: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000'
    const { token } = await this.authService.oauthEntry(req.user)
    return { url: `${frontendUrl}/auth/callback?token=${token}` }
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: 3600,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Post('register')
  @UseGuards(AuthGuard('jwt'))
  async register(@Body() body: RegisterDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ANONYMOUS)
      throw new UnauthorizedException()
    return {
      token: this.registrationService.registerLocal(body)
    }
  }

  @Throttle({
    default: {
      limit: 4,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(
    @Body() emailVerifyDto: EmailVerifyDto,
    @Request() req: any
  ) {
    if (req.user.accountStatus !== AccountStatus.EMAIL_VERIFICATION)
      throw new UnauthorizedException()
    return this.registrationService.verifyEmail(
      req.user._id,
      emailVerifyDto.verificationCode
    )
  }

  @Throttle({
    default: {
      limit: 1,
      ttl: 60,
      generateKey: context => context.switchToHttp().getRequest().user.id
    }
  })
  @Post('resend-email')
  @UsePipes(EmptyBodyValidationPipe)
  @UseGuards(JwtAuthGuard)
  async resendEmail(@Body() body: undefined, @Request() req: any) {
    return this.registrationService.resendVerificationEmail(req.user.id)
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  async onboarding(@Body() onboardingDto: OnboardingDto, @Request() req: any) {
    return this.registrationService.registerOnboarding(
      req.user._id,
      onboardingDto
    )
  }

  @Post('onboarding/oauth') // TODO : Add throttle
  @UseGuards(JwtAuthGuard)
  async onboardingOauth(@Body() body: OAuthOnboardingDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ONBOARDING_OAUTH)
      throw new UnauthorizedException()
    return this.registrationService.registerOnboardingOauth(body, req.user.data)
  }

  @Post('refresh-token')
  @UsePipes(EmptyBodyValidationPipe)
  async refreshToken(@Request() req: any) {
    //get token from cookies
    const refreshToken = req.cookies['refresh-token']
    if (!refreshToken) throw new UnauthorizedException()
    return this.authService.refreshToken(refreshToken)
  }
}
