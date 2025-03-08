import {
  IsBoolean,
  IsJWT,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { IClassroomCreateDto } from '../../common/interfaces/'

export class CreateClassroomDto implements IClassroomCreateDto {
  @ApiProperty({
    description: 'Classroom name',
    example: 'CSE-101',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  title: string

  @ApiProperty({
    description: 'Classroom icon (uploaded url)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
    minLength: 2,
    maxLength: 500
  })
  @IsOptional()
  @IsJWT() // Will be decoded and validated by the JWT strategy, this is to ensure the client sends a valid URL
  icon?: string
  @ApiProperty({
    description: 'Is the classroom is public',
    example: false
  })
  @IsBoolean()
  public: boolean
  @ApiProperty({
    description: 'Classroom name',
    example: 'cse101',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+[a-z0-9_.]*[a-z0-9]$/, {
    message:
      'Classroom name can only contain lowercase letters, numbers, and underscores, must start with a letter or' +
      ' number, and cannot end with an underscore or .'
  })
  classroomName: string
  @ApiProperty({
    description: 'Classroom description',
    example: 'Introduction to Computer Science',
    minLength: 2,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  description: string
}
