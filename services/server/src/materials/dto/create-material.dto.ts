import { IMaterial } from '../../common/interfaces/material.interface'
import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsJWT,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'

export class CreateMaterialDto implements Partial<IMaterial> {
  @ApiProperty({
    description: 'Material title',
    example: 'Lecture Notes 1',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string

  @ApiProperty({
    description: 'Material description',
    example: 'Notes for the first lecture',
    minLength: 2,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: 'Material file URL (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsNotEmpty()
  @IsJWT()
  fileUrl: string

  @ApiProperty({
    description: 'Original filename',
    example: 'lecture_notes.pdf'
  })
  @IsNotEmpty()
  @IsString()
  fileName: string

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  @IsNotEmpty()
  @IsNumber()
  fileSize: number

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf'
  })
  @IsNotEmpty()
  @IsString()
  mimeType: string

  @ApiProperty({
    description: 'Is the material public',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @ApiProperty({
    description: 'Tags for the material',
    example: ['lecture', 'notes'],
    default: []
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}
