import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSION_KEY } from '../common/constants'
import { ClassroomService } from '../classroom/classroom.service'
import { Types } from 'mongoose'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly classrooomService: ClassroomService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<bigint>(
      PERMISSION_KEY,
      context.getHandler()
    )
    if (requiredPermission === undefined) return true

    const { user } = context.switchToHttp().getRequest()
    const classroomId = context.switchToHttp().getRequest().params.id
    if (!classroomId) return true //skip permission check if classroomId is not present

    return this.classrooomService.permissionCheck(
      new Types.ObjectId(classroomId),
      new Types.ObjectId(user._id),
      requiredPermission
    )
  }
}
