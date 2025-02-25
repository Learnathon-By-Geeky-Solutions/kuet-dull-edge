import { IsString, MaxLength, MinLength } from 'class-validator'

export class EmailVerifyDto {
  @IsString()
  @MinLength(6, {
    message: 'Verification code must be at least 6 characters long'
  })
  @MaxLength(10, {
    message: 'Verification code cannot be longer than 10 characters'
  })
  verificationCode: string
}
