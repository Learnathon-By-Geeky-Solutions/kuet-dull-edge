import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import { CreateClassroomDto } from './dto/create-classroom.dto'
import { UpdateClassroomDto } from './dto/update-classroom.dto'
import {
  ClassMemberShipRepository,
  ClassRoleRepository,
  ClassroomRepository
} from './repository/classroom.repository'
import { Types } from 'mongoose'
import { IClassMember, IClassroom, IRole } from '../common/interfaces'
import { SuccessResponseDto } from '../common/dto/success-response.dto'
import { Permission } from './enums/RolePermissions.enum'

@Injectable()
export class ClassroomService {
  constructor(
    private readonly classroomRepository: ClassroomRepository,
    private readonly classRoleRepository: ClassRoleRepository,
    private readonly classMemberShipRepository: ClassMemberShipRepository
  ) {}

  async permissionCheck(
    classroomId: Types.ObjectId,
    userId: Types.ObjectId,
    requiredPermission: bigint
  ) {
    // TODO: use clasroomIdXuserId to cache user permissions
    // we can also cache classroomXroles to reduce db calls - with less space?!
    const membership = await this.classMemberShipRepository.findOne({
      userId,
      classroomId
    })
    if (!membership) {
      throw new ForbiddenException('NOT_A_MEMBER')
    }
    const roles = membership?.roles || []
    console.log(roles)
    let userPermissions = 0n
    const roleArr = await this.classRoleRepository.findAll({
      _id: { $in: roles }
    })
    console.log(roleArr)

    roleArr.forEach(role => {
      userPermissions |= Permission.encode(role.permissions)
      console.log(role)
    })
    const hasPermission = requiredPermission & userPermissions
    if (!hasPermission) {
      throw new ForbiddenException('INSUFFICIENT_PERMISSION')
    }

    return true
  }

  async create(
    userId: Types.ObjectId,
    createClassroomDto: CreateClassroomDto
  ): Promise<SuccessResponseDto> {
    //check if classroom already exists
    const classroomE = await this.classroomRepository.findOne({
      classroomName: createClassroomDto.classroomName
    })
    console.log(userId)
    if (classroomE) throw new ConflictException('CLASSROOM_NAME_ALREADY_EXISTS')
    //TODO: move these to config
    // TODO: Apply transaction later
    const classroom: IClassroom = {
      _id: new Types.ObjectId(),
      owner: userId,
      ...createClassroomDto
    }

    const adminRole: IRole = {
      _id: new Types.ObjectId(),
      classroomId: classroom._id,
      name: 'Admin',
      permissions: [0, 0]
    }
    const teacherRole: IRole = {
      _id: new Types.ObjectId(),
      classroomId: classroom._id,
      name: 'Teacher',
      permissions: [0, 0]
    }
    const studentRole: IRole = {
      _id: new Types.ObjectId(),
      classroomId: classroom._id,
      name: 'Student',
      permissions: [0, 0]
    }
    const classRepRole: IRole = {
      _id: new Types.ObjectId(),
      classroomId: classroom._id,
      name: 'Class Rep',
      permissions: [0, 0]
    }
    const member: IClassMember = {
      userId,
      classroomId: classroom._id,
      roles: [adminRole._id]
    }
    const classroomSaved = await this.classroomRepository.create(classroom)
    const rolesCreated = await this.classRoleRepository.createMany([
      adminRole,
      teacherRole,
      studentRole,
      classRepRole
    ])
    const classMembershipCreated = await this.classMemberShipRepository.create(member)
    if (!(classroomSaved && rolesCreated && classMembershipCreated)) {
      // Rollback
      await this.classroomRepository.deleteOne({ _id: classroom._id })
      await this.classRoleRepository.deleteOne({ _id: adminRole._id })
      await this.classRoleRepository.deleteOne({ _id: teacherRole._id })
      await this.classRoleRepository.deleteOne({ _id: studentRole._id })
      await this.classRoleRepository.deleteOne({ _id: classRepRole._id })
      await this.classMemberShipRepository.deleteOne({ userId: member.userId })
      throw new InternalServerErrorException('DB_ERROR')
    }
    return {
      success: true
    }
  }

  findOwn(userId: string) {
    return this.classMemberShipRepository.findOneWithSelect({
      userId: new Types.ObjectId(userId)
    })
  }

  findOne(id: string) {
    return `This action returns a #${id} classroom`
  }

  update(id: number, updateClassroomDto: UpdateClassroomDto) {
    return `This action updates a #${id} classroom`
  }

  remove(id: number) {
    return `This action removes a #${id} classroom`
  }
}
