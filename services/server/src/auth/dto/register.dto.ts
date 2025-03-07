import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { IRegister } from 'src/common/interfaces/auth.interfaces'

export class RegisterDto implements IRegister {
  @ApiProperty({
    description: 'Username of the user',
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

  @ApiProperty({
    description: 'Email address of the user',
    minLength: 6,
    maxLength: 128
  })
  @IsEmail()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  email: string
  @ApiProperty({
    description: 'Password of the user',
    minLength: 8,
    maxLength: 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,64}$'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/)
  password: string
}
