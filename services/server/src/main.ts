import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { VersioningType } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'

// TODO : Use SSL
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableVersioning({
    type: VersioningType.URI
  })
  app.use(cookieParser())
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap().then(() => console.log('Server started'))
