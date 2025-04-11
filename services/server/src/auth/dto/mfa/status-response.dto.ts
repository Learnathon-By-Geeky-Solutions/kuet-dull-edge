import { ApiProperty } from '@nestjs/swagger'
import { MFAType } from '../../../../common/enums'
import { IMfaStatus, IMfaStatusResponse } from 'src/common/interfaces/mfa.interface'
import { Types } from 'mongoose'
import { IsEnum, Matches } from 'class-validator'

export class MfaStatusItemDto implements IMfaStatus {
  @ApiProperty({
    enum: MFAType,
    description: 'Type of MFA',
    example: MFAType.TOTP
  })
  @IsEnum(MFAType)
  type: MFAType

  @ApiProperty({
    description: 'MFA ID',
    example: '5f9d5b5b9d5b5b9d5b5b9d5b'
  })
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ID'
  })
  _id: Types.ObjectId
}

export class MfaStatusResponseDto implements IMfaStatusResponse {
  @ApiProperty({
    type: [MfaStatusItemDto],
    description: 'List of active MFA methods'
  })
  mfaList: MfaStatusItemDto[]
}
