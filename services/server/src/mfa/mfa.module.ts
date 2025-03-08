import { Module } from '@nestjs/common'
import { MfaService } from './mfa.service'
import { MfaController } from './mfa.controller'
import { AuthModule } from 'src/auth/auth.module'
import { UsersModule } from 'src/users/users.module'

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [MfaController],
  providers: [MfaService]
})
export class MfaModule {}
