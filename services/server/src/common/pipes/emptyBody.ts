import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class EmptyBodyValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || Object.keys(value).length === 0) {
      return value
    }
    throw new BadRequestException('Body should be empty')
  }
}
