import { IsJWT, IsNotEmpty, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { IEmailVerify } from 'src/common/interfaces/auth.interfaces'

export class EmailVerifyDto implements IEmailVerify {
  @ApiProperty({ description: 'JWT token for email verification', example: 'eyJhbGciOiJIUzI1NiIsInR5.cCI6IkpXVCJ9' })
  @IsJWT()
  @IsNotEmpty()
  token: string

  @ApiProperty({ description: 'Refresh token for authentication', example: 123456 })
  @IsNotEmpty()
  @IsNumber()
  verificationCode: number
}
