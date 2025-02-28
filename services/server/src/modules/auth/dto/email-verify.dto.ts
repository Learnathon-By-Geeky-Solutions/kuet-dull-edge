import { IsString, MinLength, MaxLength } from 'class-validator'
import { IEmailVerifyDto } from '../../../interfaces/auth.interfaces'

export class EmailVerifyDto implements IEmailVerifyDto {
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  verificationCode: string
}
