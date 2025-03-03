import {
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'

export class OnboardingDto {
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
}
