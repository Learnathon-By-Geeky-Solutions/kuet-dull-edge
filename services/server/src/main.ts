import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { VersioningType } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'

// TODO : Use SSL
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1'
  })
  app.use(cookieParser())
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ScholrFlow API')
    .setDescription('API for ScholrFlow')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api', app, document)
  await app.listen(process.env.PORT ?? 3000)
}

bootstrap().then(() => console.log('Server started'))
