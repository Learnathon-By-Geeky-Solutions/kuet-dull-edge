import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { config } from '../../config'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: config.authProviders.google.oauthClientId,
      clientSecret: config.authProviders.google.oauthClientSecret,
      callbackURL: `${config._.base_url}/auth/google/callback`,
      scope: ['email', 'profile']
    })
  }
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile
    const user = {
      email: emails[0]?.value,
      name: name?.givenName + ' ' + name?.familyName,
      picture: photos?.[0]?.value
    }
    done(null, user)
  }
}
