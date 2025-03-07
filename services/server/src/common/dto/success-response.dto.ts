import { ApiProperty } from '@nestjs/swagger'
import { ISuccessResponse } from '../interfaces/mfa.interface'

export class SuccessResponseDto implements ISuccessResponse {
  @ApiProperty({
    description: 'Operation success status',
    example: true
  })
  success: boolean
}
