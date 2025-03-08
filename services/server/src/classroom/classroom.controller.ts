import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards
} from '@nestjs/common'
import { ClassroomService } from './classroom.service'
import { CreateClassroomDto } from './dto/create-classroom.dto'
import { UpdateClassroomDto } from './dto/update-classroom.dto'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Types } from 'mongoose'
import { Permission } from './enums/RolePermissions.enum'
import { PermissionRequired } from './decorators/permissions-required.decorator'
import { PermissionGuard } from '../guards/permission.guard'

@Controller('classroom')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomService.create(
      new Types.ObjectId(req?.user?._id),
      createClassroomDto
    )
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOwn(@Request() req) {
    return this.classroomService.findOwn(req.user._id)
  }

  @Get(':id')
  @PermissionRequired(Permission.OWNER | Permission.UPDATE_CLASSROOM)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  findOne(@Param('id') id: string) {
    return this.classroomService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassroomDto: UpdateClassroomDto) {
    return this.classroomService.update(+id, updateClassroomDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classroomService.remove(+id)
  }
}
