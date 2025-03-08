import { ApiProperty, ApiExtraModels } from '@nestjs/swagger'
import { IMfaSetupResult } from 'src/common/interfaces/mfa.interface'
import { Types } from 'mongoose'

@ApiExtraModels()
export class MfaSetupResponseDto implements IMfaSetupResult {
  @ApiProperty({
    description: 'Secret key for TOTP MFA',
    example: 'JBSWY3DPEHPK3PXP',
    required: true
  })
  secret: string

  @ApiProperty({
    description: 'URI for QR code generation (only for TOTP)',
    example: 'otpauth://totp/ScholrFlow:username?secret=JBSWY3DPEHPK3PXP&issuer=ScholrFlow',
    required: true
  })
  uri: string

  @ApiProperty({
    description: 'MFA ID for future verification',
    example: '5f9d5b5b9d5b5b9d5b5b9d5b',
    type: String,
    required: true
  })
  mfaId: Types.ObjectId
}
