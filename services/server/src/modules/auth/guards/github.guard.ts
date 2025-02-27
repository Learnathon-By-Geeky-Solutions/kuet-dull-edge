import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class GithubGuard extends AuthGuard('github') {
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    const req = context.switchToHttp().getRequest()
    req.userData = user
    return user
  }
}
