import { HttpException, Injectable } from '@nestjs/common'
import axios from 'axios'
import { config } from '../../config'

@Injectable()
export class CaptchaService {
  async verify(token: string): Promise<boolean> {
    const captchaProvider = config.captchaProvider

    if (!token) {
      throw new HttpException('CAPTCHA_TOKEN_MISSING', 400)
    }

    if (captchaProvider === 'mcaptcha') {
      return this.verifyMcaptcha(token)
    } else {
      // Handle other captcha providers if needed
      throw new HttpException('UNSUPPORTED_CAPTCHA_PROVIDER', 500)
    }
  }

  private async verifyMcaptcha(token: string): Promise<boolean> {
    try {
      const payload = {
        token,
        key: config.captchaProviders.mcaptcha.key,
        secret: config.captchaProviders.mcaptcha.secret
      }

      const response = await axios.post(config.captchaProviders.mcaptcha.url, payload)

      if (response.status !== 200) {
        throw new HttpException('C_ERR', 502)
      }

      if (!response.data) {
        throw new HttpException('C_ERR', 502)
      }

      const data = response.data as any

      const valid = data.valid as boolean

      if (!valid) {
        throw new HttpException('CAPTCHA_FAILED', 400)
      }

      return true
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException('CAPTCHA_SERVICE_ERROR', 502)
    }
  }
}
