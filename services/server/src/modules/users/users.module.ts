import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserAuthService } from './services/user-auth.service'
import { UserDetailsService } from './services/user-details.service'
import { UserPeekService } from './services/user-peek.service'
import { UserAuth, UserAuthSchema } from './schemas/user-auth.schema'
import { UserDetails, UserDetailsSchema } from './schemas/user-details.schema'
import { UserPeek, UserPeekSchema } from './schemas/user-peek.schema'

// filepath: /home/zihad/Projects/kuet-dull-edge/services/server/src/modules/users/users.module.ts

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAuth.name, schema: UserAuthSchema },
      { name: UserDetails.name, schema: UserDetailsSchema },
      { name: UserPeek.name, schema: UserPeekSchema }
    ])
  ],
  providers: [UserAuthService, UserDetailsService, UserPeekService],
  exports: [UserAuthService, UserDetailsService, UserPeekService]
})
export class UsersModule {}
