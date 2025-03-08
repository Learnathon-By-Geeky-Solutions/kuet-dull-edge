import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { config } from './config'
import { JwtModule } from '@nestjs/jwt'
import { MiddlewareConsumer } from '@nestjs/common/interfaces'
import { ApiVersionMiddleware } from './middlewares/api-version.middleware'
import { MfaModule } from './mfa/mfa.module'
import { ClassroomModule } from './classroom/classroom.module'
import { ChatModule } from './chat/chat.module'
import { MaterialsModule } from './materials/materials.module'
import { CalendarModule } from './calendar/calendar.module'
import { TodosModule } from './todos/todos.module'

@Module({
  imports: [
    MongooseModule.forRoot(config._.mongo_uri),
    JwtModule.register({
      secret: config._.jwt_secret,
      signOptions: { expiresIn: '15m' }
    }),

    AuthModule,
    UsersModule,
    MfaModule,
    ClassroomModule,
    ChatModule,
    MaterialsModule,
    CalendarModule,
    TodosModule
  ],
  controllers: [],
  providers: [],
  exports: [MfaModule]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiVersionMiddleware).forRoutes('*')
  }
}
