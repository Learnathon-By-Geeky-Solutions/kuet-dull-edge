import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'
import { IMfa, IMfaRecovery } from 'src/common/interfaces/mfa.interface'

export class MfaRecoveryDto implements IMfaRecovery {
  @ApiProperty({
    description: 'Recovery code',
    example: 'AB12CD34EF'
  })
  @IsString()
  @IsNotEmpty()
  code: string
}
