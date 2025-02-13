import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UsePipes
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService
  ) {}

  // TODO : Load throttle config from config file
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @Get()
  @UsePipes(EmptyBodyValidationPipe)
  async anonymous(@Body() body: undefined) {
    return this.authService.getAnonymousUser()
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    return
  }

  @Get('/google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(@Request() req: any) {
    return this.authService.signUporLogin(req.user)
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
    if (req.user.accountStatus !== AccountStatus.ANONYMOUS) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED)
    }
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
    if (req.user.accountStatus !== AccountStatus.EMAIL_VERIFICATION) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED)
    }
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
    if (req.user.accountStatus !== AccountStatus.ONBOARDING_OAUTH) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED)
    }
    return this.registrationService.registerOnboardingOauth(body, req.user.data)
  }
}
