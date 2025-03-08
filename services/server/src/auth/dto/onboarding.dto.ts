import {
  IsISO8601,
  IsJWT,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { IOnboarding } from '../../common/interfaces/'

export class OnboardingDto implements IOnboarding {
  @ApiProperty({
    description: 'Access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  })
  @IsNotEmpty()
  @IsJWT()
  token: string
  @ApiProperty({
    description: 'Name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @ApiProperty({
    description: 'User date of birth in ISO8601 format',
    example: '1990-01-01',
    format: 'date'
  })
  @IsNotEmpty()
  @IsISO8601()
  birthday: Date

  @ApiProperty({
    description: 'Educational institute name',
    example: 'KUET',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  institute: string

  @ApiProperty({
    description: 'Institute identifier or student ID',
    example: '1805046',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  instituteIdentifier: string
}
