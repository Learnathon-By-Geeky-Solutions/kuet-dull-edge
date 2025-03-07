import { ApiProperty } from '@nestjs/swagger'
import { IsString, Matches, IsNotEmpty, IsMongoId } from 'class-validator'
import { IMfaVerifyCode } from 'src/common/interfaces/mfa.interface'
import { Types } from 'mongoose'
export class MfaVerifyRecCodeDto implements IMfaVerifyCode {
  @ApiProperty({
    description: 'Verification code',
    example: 'nu8nn000'
  })
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty({
    description: 'MFA ID',
    example: '5f9d5b5b9d5b5b9d5b5b9d5b'
  })
  @IsMongoId()
  @IsNotEmpty()
  mfaId: Types.ObjectId
}
