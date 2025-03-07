import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsMongoId, IsNumber, Min, Max } from 'class-validator'
import { Types } from 'mongoose'
import { IMfaVerification } from 'src/common/interfaces/mfa.interface'

export class MfaVerifyDto implements IMfaVerification {
  @ApiProperty({
    description: 'Verification code',
    example: '123456'
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(100000)
  @Max(999999)
  code: number

  @ApiProperty({
    description: 'MFA ID',
    example: '5f9d5b5b9d5b5b9d5b5b9d5b'
  })
  @IsMongoId()
  @IsNotEmpty()
  mfaId: Types.ObjectId
}
