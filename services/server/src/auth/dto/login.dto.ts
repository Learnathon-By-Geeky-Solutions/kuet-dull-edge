import { ILogin } from '../../common/interfaces'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class LoginDto implements ILogin {
  @ApiProperty({
    description: 'Username of the user',
    example: 'user_name',
    minLength: 3,
    maxLength: 128
  })
  @MinLength(3)
  @MaxLength(128)
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty({
    description: 'Password of the user',
    example: 'Password123!',
    minLength: 8,
    maxLength: 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,64}$'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/)
  password: string
}
