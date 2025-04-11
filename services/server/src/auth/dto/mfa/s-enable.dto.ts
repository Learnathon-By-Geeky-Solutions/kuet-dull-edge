import { IMfaEnableResult } from '../../../../common/interfaces/mfa.interface'
import { ApiProperty } from '@nestjs/swagger'

export class MfaSEnableResultDto implements IMfaEnableResult {
  @ApiProperty({
    description: 'Recovery code for MFA authentication',
    example: 'AB12CD34EF',
    required: true,
    type: String
  })
  recoveryCodes: string[]
}
