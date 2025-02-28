import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserAuth, UserAuthSchema } from './repository/user-auth.schema'
import { UserDetails, UserDetailsSchema } from './repository/user-details.schema'
import { UserPeek, UserPeekSchema } from './repository/user-peek.schema'
import { UserAuthRepository, UserDetailsRepository, UserPeekRepository } from './repository/users.repository'
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAuth.name, schema: UserAuthSchema },
      { name: UserDetails.name, schema: UserDetailsSchema },
      { name: UserPeek.name, schema: UserPeekSchema }
    ])
  ],
  providers: [UserAuthRepository, UserDetailsRepository, UserPeekRepository],
  exports: [UserAuthRepository, UserDetailsRepository, UserPeekRepository]
})
export class UsersModule {}
