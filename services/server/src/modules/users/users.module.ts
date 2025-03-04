import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserAuth, UserAuthSchema } from './repository/user-auth.schema'
import { UserDetails, UserDetailsSchema } from './repository/user-details.schema'
import { UserPeek, UserPeekSchema } from './repository/user-peek.schema'
import { UserMFA, UserMFASchema } from './repository/user-mfa.schema'
import {
  UserAuthRepository,
  UserDetailsRepository,
  UserMFARepository,
  UserPeekRepository
} from './repository/users.repository'
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAuth.name, schema: UserAuthSchema },
      { name: UserDetails.name, schema: UserDetailsSchema },
      { name: UserPeek.name, schema: UserPeekSchema },
      { name: UserMFA.name, schema: UserMFASchema }
    ])
  ],
  providers: [UserAuthRepository, UserDetailsRepository, UserPeekRepository, UserMFARepository],
  exports: [UserAuthRepository, UserDetailsRepository, UserPeekRepository, UserMFARepository]
})
export class UsersModule {}
