import { ApiProperty } from '@nestjs/swagger'

export class TokenResponseDto {
  @ApiProperty({
    description: 'Authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  token: string
}
