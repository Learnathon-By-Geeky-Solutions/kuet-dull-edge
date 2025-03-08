import { Injectable } from '@nestjs/common'
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception'
import { Types } from 'mongoose'
import * as speakeasy from 'speakeasy'
import * as crypto from 'crypto'
import { MFAType } from '../common/enums/mfa-type.enum'
import { UserAuthRepository, UserMFARepository } from '../users/repository/users.repository'
import { EmailVerificationRepository } from '../auth/repository/auth.repository'
import { AuthService } from '../auth/auth.service'
import { IMfaStatusResponse } from 'src/common/interfaces/mfa.interface'

@Injectable()
export class MfaService {
  constructor(
    private readonly authService: AuthService,
    private readonly userAuthRepository: UserAuthRepository,
    private readonly userMFARepository: UserMFARepository,
    private readonly emailVerificationRepository: EmailVerificationRepository
  ) {}

  // TODO: Move emailVerification to this service
  // TODO: Controller should use guards to check if account is active
  generateTOTPMFASecret(username: string): { secret: string; uri: string } {
    const base32Secret = speakeasy.generateSecret({ name: 'ScholrFlow', issuer: 'ScholrFlow' })
    const uri = speakeasy.otpauthURL({
      secret: base32Secret.ascii,
      label: `Schlorflow ${username}`, // TODO: use config
      issuer: 'ScholrFlow'
    })
    return {
      secret: base32Secret.base32,
      uri: uri
    }
  }

  verifyTOTPMFAcode(secret: string, code: number): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code.toString()
    })
  }

  async generateEmailMFASecret(userId: Types.ObjectId): Promise<string> {
    const user = await this.userAuthRepository.findById(userId)
    if (!user) throw new BadRequestException('USER_NOT_FOUND')
    const email = user.email
    const emailVerification = await this.authService.createVerification(userId)
    this.authService.sendVerificationEmail(email, emailVerification)
    return email
  }

  async verifyEmailMFACode(userId: Types.ObjectId, code: number): Promise<boolean> {
    const secret = await this.emailVerificationRepository.findByUserId(userId)
    return secret.compareVerificationCode(code)
  }

  async setupMFA(
    //TODO: check if MFA already enabled of the same type, or allow a limited number of MFA types
    userId: Types.ObjectId,
    type: MFAType,
    secret?: string
  ): Promise<{ secret: string; uri: string; mfaId: Types.ObjectId }> {
    if (type === MFAType.EMAIL) {
      //user email is the secret
      const email = await this.generateEmailMFASecret(userId)
      const working = await this.userMFARepository.createMFA(userId, {
        enabled: false,
        type,
        secret: email
      })
      return { secret: email, uri: '', mfaId: working._id }
    } else if (type === MFAType.TOTP) {
      const { secret, uri } = this.generateTOTPMFASecret((await this.userAuthRepository.findById(userId)).username)
      const working = await this.userMFARepository.createMFA(userId, {
        enabled: false,
        type,
        secret
      })
      return { secret, uri, mfaId: working._id }
    } else {
      throw new BadRequestException('INVALID_MFA_TYPE')
    }
  }

  async verifyAndEnableMFA(userId: string, code: number, mfaId: Types.ObjectId): Promise<{ recoveryCodes: string[] }> {
    const _userId = new Types.ObjectId(userId)
    const userMfa = await this.userMFARepository.findById(mfaId)
    if (!userMfa) throw new BadRequestException('MFA_SETUP_NOT_INITIATED')
    if (userMfa.enabled) throw new BadRequestException('MFA_ALREADY_ENABLED')
    if (userMfa.userId.toString() !== userId.toString()) throw new BadRequestException('MFA_INVALID_USER')
    if (userMfa.type === MFAType.EMAIL) {
      if (!(await this.verifyEmailMFACode(_userId, code))) throw new BadRequestException('INVALID_CODE')
    }
    if (userMfa.type === MFAType.TOTP) {
      if (!this.verifyTOTPMFAcode(userMfa.secret, code)) throw new BadRequestException('INVALID_CODE')
    }
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex').toUpperCase()) // TODO:use config
    await this.userMFARepository.updateRecoveryCodes(_userId, recoveryCodes)
    await this.userMFARepository.enableMFA(mfaId)
    return { recoveryCodes }
  }

  async enableMFA(userId: Types.ObjectId, type: MFAType, secret: string): Promise<{ recoveryCodes: string[] }> {
    const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex').toUpperCase()) // TODO:use config
    await this.userMFARepository.updateRecoveryCodes(userId, recoveryCodes)
    return { recoveryCodes }
  }

  async verifyMFA(userId: Types.ObjectId, mfaId: Types.ObjectId, code: number): Promise<boolean> {
    const userMfa = await this.userMFARepository.findOne({ _id: mfaId })
    if (!userMfa) throw new BadRequestException('MFA_SETUP_NOT_INITIATED')
    if (!userMfa.enabled) throw new BadRequestException('MFA_NOT_ENABLED')
    if (userMfa.userId.toString() !== userId.toString()) throw new BadRequestException('MFA_INVALID_USER')
    if (userMfa.type === MFAType.EMAIL) {
      return await this.verifyEmailMFACode(userId, code)
    } else if (userMfa.type === MFAType.TOTP) {
      return this.verifyTOTPMFAcode(userMfa.secret, code)
    }
    return false
  }

  async getMFAStatus(userId: Types.ObjectId): Promise<IMfaStatusResponse | null> {
    const userMfa = await this.userMFARepository.findAll({ userId })
    if (!userMfa) {
      return null
    }
    return { mfaList: userMfa.filter(mfa => mfa.enabled).map(mfa => ({ type: mfa.type, _id: mfa._id })) }
  }

  async disableMFA(userId: Types.ObjectId): Promise<void> {
    await this.userMFARepository.disableMFA(userId)
  }

  async validateRecoveryCode(userId: Types.ObjectId, code: string): Promise<boolean> {
    return this.userMFARepository.validateRecoveryCode(userId, code)
  }
}
