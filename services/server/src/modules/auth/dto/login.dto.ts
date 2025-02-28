import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { ILoginDto } from '../../../interfaces/auth.interfaces'

export class LoginDto implements ILoginDto {
  @ApiProperty({
    description: 'Username',
    example: 'username'
  })
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty({
    description: 'Password',
    example: 'password'
  })
  @IsString()
  @IsNotEmpty()
  password: string
}
