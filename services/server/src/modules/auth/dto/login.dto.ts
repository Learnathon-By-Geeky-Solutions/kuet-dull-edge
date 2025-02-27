import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class LoginDto {
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
