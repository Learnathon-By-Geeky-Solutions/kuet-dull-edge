import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { MFAType } from '../../common/enums/mfa-type.enum'
import { IMfa } from 'src/common/interfaces/mfa.interface'

export class MfaSetupDto implements Partial<IMfa> {
  @ApiProperty({
    enum: MFAType,
    description: 'Type of MFA to setup',
    example: MFAType.TOTP
  })
  @IsEnum(MFAType)
  type: MFAType
}
