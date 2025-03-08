import { Classroom } from './classroom.schema'
import { ClassMemberShip } from './class-membership.schema'
import { ClassRole } from './class-role.schema'
import { Injectable } from '@nestjs/common'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { GenericRepository } from '../../common/repository/generic.repository'

@Injectable()
export class ClassroomRepository extends GenericRepository<Classroom> {
  constructor(
    @InjectModel(Classroom.name)
    private readonly classroomModel: Model<Classroom>
  ) {
    super(classroomModel)
  }
}

@Injectable()
export class ClassMemberShipRepository extends GenericRepository<ClassMemberShip> {
  constructor(
    @InjectModel(ClassMemberShip.name)
    private readonly classMemberShipModel: Model<ClassMemberShip>
  ) {
    super(classMemberShipModel)
  }
}

@Injectable()
export class ClassRoleRepository extends GenericRepository<ClassRole> {
  constructor(
    @InjectModel(ClassRole.name)
    private readonly classRoleModel: Model<ClassRole>
  ) {
    super(classRoleModel)
  }
}
