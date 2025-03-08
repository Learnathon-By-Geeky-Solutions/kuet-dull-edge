import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import * as mongoSanitize from 'express-mongo-sanitize'

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    const sanitized = mongoSanitize.sanitize(value)
    if (sanitized !== value) {
      throw new BadRequestException('Invalid input data')
    }
    return sanitized
  }
}
