import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { config } from '../../config'
import { AccountStatus } from '../../users/schemas/user-auth.schema'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config._.jwt_secret
    })
  }

  async validate(payload: any) {
    return payload
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config._.jwt_secret
    })
  }

  async validate(payload: any) {
    if (payload.accountStatus !== AccountStatus.ACTIVE) return payload

    throw new UnauthorizedException('INVALID_ACCOUNT_STATUS')
  }
}
