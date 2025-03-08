import { MfaService } from './mfa.service'
import { MfaController } from './mfa.controller'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { UserMFARepository } from './repository/mfa.repository'
import { UserMFA, UserMFASchema } from './repository/user-mfa.schema'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([{ name: UserMFA.name, schema: UserMFASchema }])
  ],
  providers: [MfaService, UserMFARepository],
  controllers: [MfaController],
  exports: [MfaService]
})
export class MfaModule {}
