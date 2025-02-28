import { ApiProperty } from '@nestjs/swagger'
import { ITokenResponseDto } from '../../../interfaces/auth.interfaces'

export class TokenResponseDto implements ITokenResponseDto {
  @ApiProperty({
    description: 'Authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  token: string
}
