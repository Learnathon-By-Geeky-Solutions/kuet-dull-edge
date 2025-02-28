import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github'
import { config } from '../../config'

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: config.authProviders.github.oauthClientId,
      clientSecret: config.authProviders.github.oauthClientSecret,
      callbackURL: `${config._.base_url}/auth/github/callback`,
      scope: ['user:email']
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { photos, emails, displayName } = profile
    const user = {
      name: displayName, // Get the full name from GitHub
      email: emails?.[0]?.value,
      picture: photos[0]?.value
    }
    done(null, user)
  }
}
