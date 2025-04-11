import { ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { IMfaRecovery } from 'src/common/interfaces/mfa.interface'

@ApiTags('MFA')
export class MfaRecoveryDto implements IMfaRecovery {
  @ApiProperty({
    description: 'Recovery code for MFA authentication',
    example: 'AB12CD34EF',
    required: true,
    type: String
  })
  @IsString()
  @IsNotEmpty()
  code: string
}
