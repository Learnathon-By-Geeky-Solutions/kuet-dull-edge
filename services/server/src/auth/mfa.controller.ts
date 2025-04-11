import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common'
import { MfaService } from './mfa.service'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard'
import { AccountStatus } from '../../../common/enums'
import {
  MfaRecoveryDto,
  MfaSEnableResultDto,
  MfaSetupDto,
  MfaSetupResponseDto,
  MfaStatusResponseDto,
  MfaVerifyDto
} from './dto'
import { SuccessResponseDto } from '../../../common/dto/success-response.dto'

@ApiTags('MFA')
@ApiBearerAuth()
@Controller('/auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @ApiOperation({ summary: 'Get user MFA status' })
  @ApiResponse({
    status: 200,
    description: 'MFA status retrieved successfully',
    type: MfaStatusResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMFAStatus(@Request() req: any): Promise<MfaStatusResponseDto> {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.getMFAStatus(req.user._id)
  }

  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @UseGuards(JwtAuthGuard)
  async verifyMFACode(@Body() verifyRecCodeDto: MfaVerifyDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    const isValid = await this.mfaService.verifyMFA(
      req.user._id,
      verifyRecCodeDto.mfaId,
      verifyRecCodeDto.code
    )
    if (!isValid) throw new UnauthorizedException('INVALID_CODE')
    return { success: true }
  }

  @ApiOperation({ summary: 'Use MFA recovery code' })
  @ApiResponse({
    status: 200,
    description: 'Recovery code validated successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid recovery code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('recovery')
  @UseGuards(JwtAuthGuard)
  async validateRecoveryCode(@Body() recoveryDto: MfaRecoveryDto, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    const isValid = await this.mfaService.validateRecoveryCode(
      req.user._id,
      recoveryDto.code
    )
    if (!isValid) throw new UnauthorizedException('INVALID_RECOVERY_CODE')
    return { success: true }
  }

  @ApiOperation({ summary: 'Setup Multi-Factor Authentication' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated successfully',
    type: MfaSetupResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid MFA type or setup error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setupMFA(
    @Body() setupDto: MfaSetupDto,
    @Request() req: any
  ): Promise<MfaSetupResponseDto> {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.setupMFA(req.user._id, setupDto.type)
  }

  @ApiOperation({ summary: 'Verify and enable MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or MFA setup' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('setup/verify')
  @UseGuards(JwtAuthGuard)
  async verifyMFA(
    @Body() verifyDto: MfaVerifyDto,
    @Request() req: any
  ): Promise<MfaSEnableResultDto> {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.verifyAndEnableMFA(
      req.user._id.toString(),
      verifyDto.code,
      verifyDto.mfaId
    )
  }

  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disableMFA(@Request() req: any): Promise<SuccessResponseDto> {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    await this.mfaService.disableMFA(req.user._id)
    return { success: true }
  }
}
