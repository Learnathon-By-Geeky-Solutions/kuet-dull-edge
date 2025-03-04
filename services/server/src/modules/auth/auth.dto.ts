import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
  IsISO8601,
  IsEmail,
  IsObject,
  isString,
  IsJWT
} from 'class-validator'

import {
  IEmailVerifyDto,
  ILoginDto,
  IMFARecoveryDto,
  IOnboardingDto,
  IOAuthOnboardingDto,
  ITokenResponseDto
} from '../../interfaces/auth.interfaces'
export class EmailVerifyDto implements IEmailVerifyDto {
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  verificationCode: string
  @IsJWT()
  token: string
}

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

export class MFARecoveryDto implements IMFARecoveryDto {
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  code: string
}

export class OnboardingDto implements IOnboardingDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @IsNotEmpty()
  @IsISO8601()
  birthday: string

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  institute: string

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instituteIdentifier: string

  @IsNotEmpty()
  @IsJWT()
  token: string
}

export class OAuthOnboardingDto extends OnboardingDto implements IOAuthOnboardingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/)
  username: string
}

export class TokenResponseDto implements ITokenResponseDto {
  @ApiProperty({
    description: 'Authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  token: string
}
export class RegisterDto {
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

  @ApiProperty({
    description: 'Email',
    example: ''
  })
  @IsString()
  @IsEmail()
  email: string
}

export class UsernameCheckDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_.]{3,20}$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  })
  username: string
}
