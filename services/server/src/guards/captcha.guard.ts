import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { CaptchaService } from '../modules/common/captcha.service'

@Injectable()
export class McaptchaGuard implements CanActivate {
  constructor(
    private readonly enable: boolean,
    private readonly captchaService: CaptchaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enable) return true

    const request = context.switchToHttp().getRequest()
    const token = request.headers['x-captcha-token']

    return await this.captchaService.verify(token)
  }
}
