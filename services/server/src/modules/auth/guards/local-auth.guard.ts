import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super()
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    const req = context.switchToHttp().getRequest()
    req.userData = user
    return user
  }
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context)
  }
}
