import { Module } from '@nestjs/common'
import { ClassroomService } from './classroom.service'
import { ClassroomController } from './classroom.controller'
import {
  ClassMemberShipRepository,
  ClassRoleRepository,
  ClassroomRepository
} from './repository/classroom.repository'
import { MongooseModule } from '@nestjs/mongoose'
import { Classroom, ClassroomSchema } from './repository/classroom.schema'
import {
  ClassMemberShip,
  ClassMemberShipSchema
} from './repository/class-membership.schema'
import { ClassRole, ClassRoleSchema } from './repository/class-role.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Classroom.name, schema: ClassroomSchema },
      { name: ClassRole.name, schema: ClassRoleSchema },
      { name: ClassMemberShip.name, schema: ClassMemberShipSchema }
    ])
  ],
  controllers: [ClassroomController],
  providers: [
    ClassroomService,
    ClassroomRepository,
    ClassRoleRepository,
    ClassMemberShipRepository
  ]
})
export class ClassroomModule {}
