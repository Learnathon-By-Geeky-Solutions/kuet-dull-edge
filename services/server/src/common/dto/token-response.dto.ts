import { IToken } from 'src/common/interfaces'
import { ApiProperty } from '@nestjs/swagger'
import { IsJWT } from 'class-validator'

export class TokenResponseDto implements IToken {
  @ApiProperty({
    description: 'Token to be used for authentication',
    minLength: 1,
    maxLength: 512,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE2MjYwNjIwNzMsImV4cCI6MTYyNjA2MjA3NH0.1J9Z'
  })
  @IsJWT()
  token: string
}
