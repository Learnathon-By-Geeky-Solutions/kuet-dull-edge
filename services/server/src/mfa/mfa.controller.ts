import { Controller } from '@nestjs/common'
import { MfaService } from './mfa.service'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Post, Body, UseGuards, Get, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { AccountStatus } from '../../common/enums/account-status.enum'
import { UnauthorizedException } from '@nestjs/common'
import { Types } from 'mongoose'
import { MFAType } from '../../common/enums/mfa-type.enum'
import { AuthService } from '../auth.service'

@Controller('/auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}
  @ApiOperation({ summary: 'Verify and enable MFA setup' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code or MFA setup' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  async verifyMFA(@Body() body: { code: string; mfaId: string }, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.verifyAndEnableMFA(req.user._id.toString(), body.code, new Types.ObjectId(body.mfaId))
  }

  @ApiOperation({ summary: 'Get user MFA status' })
  @ApiResponse({ status: 200, description: 'MFA status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Get('mfa/status')
  @UseGuards(JwtAuthGuard)
  async getMFAStatus(@Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.getMFAStatus(req.user._id)
  }

  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  async disableMFA(@Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    await this.mfaService.disableMFA(req.user._id)
    return { success: true }
  }

  @ApiOperation({ summary: 'Use MFA recovery code' })
  @ApiResponse({ status: 200, description: 'Recovery code validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid recovery code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('mfa/recovery')
  @UseGuards(JwtAuthGuard)
  async validateRecoveryCode(@Body() body: { code: string }, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    const isValid = await this.mfaService.validateRecoveryCode(req.user._id, body.code)
    if (!isValid) throw new UnauthorizedException('INVALID_RECOVERY_CODE')
    return { success: true }
  }

  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('mfa/verify-code')
  @UseGuards(JwtAuthGuard)
  async verifyMFACode(@Body() body: { code: string; mfaId: string }, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    const isValid = await this.mfaService.verifyMFA(req.user._id, new Types.ObjectId(body.mfaId), body.code)
    if (!isValid) throw new UnauthorizedException('INVALID_CODE')
    return { success: true }
  }
  @ApiOperation({ summary: 'Setup Multi-Factor Authentication' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid MFA type or setup error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  async setupMFA(@Body() body: { type: MFAType }, @Request() req: any) {
    if (req.user.accountStatus !== AccountStatus.ACTIVE) throw new UnauthorizedException()
    return this.mfaService.setupMFA(req.user._id, body.type)
  }
}
