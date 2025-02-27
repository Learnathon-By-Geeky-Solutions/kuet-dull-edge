import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common'
import axios from 'axios'
import { config } from '../../config'

@Injectable()
export class McaptchaGuard implements CanActivate {
  constructor(private readonly enable: boolean) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.enable) return true
    const captchaProvider = config.captchaProvider
    const request = context.switchToHttp().getRequest()
    const captcha = request.headers['x-captcha-token']

    if (captchaProvider === 'mcaptcha') {
      const payload = {
        token: captcha,
        key: config.captchaProviders[captchaProvider].key,
        secret: config.captchaProviders[captchaProvider].secret
      }
      const response = await axios.post(config.captchaProviders[captchaProvider].url, payload)
      if (response.status !== 200) throw new HttpException('C_ERR', 502)
      if (!response.data) throw new HttpException('C_ERR', 502)
      const result = response.data['valid']
      if (!result) throw new HttpException('CAPTCHA_FAILED', 400)
      return true
    } else {
      // FIXME: Add support for other captcha providers
      return true
    }
  }
}
