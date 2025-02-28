import { BadRequestException, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { LoginDto } from '../modules/auth/dto/login.dto'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super()
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    const req = context.switchToHttp().getRequest()
    req.userData = user
    return user
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const body = plainToClass(LoginDto, request.body)
    const errors = await validate(body)
    const errorMessages = errors.flatMap(({ constraints }) => Object.values(constraints))
    if (errorMessages.length > 0) throw new BadRequestException('INVALID_REQUEST')

    const result = super.canActivate(context)
    if (typeof result === 'boolean') return result
    if (result instanceof Promise) return await result
    return await firstValueFrom(result)
  }
}
