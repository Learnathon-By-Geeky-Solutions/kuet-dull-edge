import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator'

export class UsernameCheckDto {
  @ApiProperty({
    description: 'Username for OAuth onboarding',
    example: 'john_doe',
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_.]{3,20}$'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/)
  username: string
}
