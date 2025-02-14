import { config as loadConfig } from 'dotenv'
import { env } from 'process'

loadConfig()
export const configuration = {
  authProvidersList: [],
  authProviders: {
    local: {},
    google: {
      oauthClientId: env.GOOGLE_OAUTH_CLIENT_ID,
      oauthClientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET
    },
    github: {
      oauthClientId: env.GITHUB_OAUTH_CLIENT_ID,
      oauthClientSecret: env.GITHUB_OAUTH_CLIENT_SECRET
    },
    facebook: {
      oauthClientId: env.FACEBOOK_OAUTH_CLIENT_ID,
      oauthClientSecret: env.FACEBOOK_OAUTH_CLIENT_SECRET
    },
    email: {
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      },
      from: env.EMAIL_FROM
    }
  },
  jwt: {
    expiresIn: env.JWT_EXPIRES_IN || 300 * 3600
  },
  captchaProvider: 'mcaptcha',
  captchaProvidersList: [], // "turnstile", "recaptcha"],
  captchaProviders: {
    mcaptcha: {
      url: env.MCAPTCHA_URL,
      key: env.MCAPTCHA_SITEKEY,
      secret: env.MCAPTCHA_SECRET
    },
    turnstile: {
      secret: env.TURNSTILE_SECRET
    },
    recaptcha: {
      secret: env.RECAPTCHA_SECRET
    }
  },
  _: {
    //  this portion is not saved in the mongodb config collection
    base_url: env.BASE_URL,
    mode: env.NODE_ENV,
    config_mongo_uri: env.CONFIG_MONGO_URI,
    port: env.PORT,
    jwt_secret: env.JWT_SECRET,
    mongo_uri: env.MONGO_URI,
    test_mongo_uri: env.TEST_MONGO_URI
  }
}

configuration.authProvidersList = Object.keys(configuration.authProviders)
configuration.captchaProvidersList = Object.keys(configuration.captchaProviders)

configuration._.mongo_uri =
  configuration._.mode == 'dev' ? env.DEV_MONGO_URI : env.MONGO_URI
configuration._.config_mongo_uri =
  configuration._.mode == 'dev'
    ? env.DEV_CONFIG_MONGO_URI
    : env.CONFIG_MONGO_URI
