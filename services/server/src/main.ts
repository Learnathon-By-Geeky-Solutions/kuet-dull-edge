import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import { config } from './config'

// TODO : Use SSL
async function bootstrap(): Promise<void> {
  if (config._.mode == 'development') mongoose.set('debug', true)
  const app = await NestFactory.create(AppModule)
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1'
  })
  app.use(cookieParser())
  //app.use(mongoSanitize())
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ScholrFlow API')
    .setDescription('API for ScholrFlow')
    .setVersion('1.0')
    .addSecurity('anonymous', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    })
    .addBearerAuth() //class room handled by redis, no need for new token
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api', app, document)
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap().then(() => console.log('Server started'))
