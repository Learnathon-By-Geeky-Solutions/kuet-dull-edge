import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { config } from './modules/config'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    MongooseModule.forRoot(config._.mongo_uri),
    JwtModule.register({
      secret: config._.jwt_secret,
      signOptions: { expiresIn: '15m' }
    }),
    AuthModule,
    UsersModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
