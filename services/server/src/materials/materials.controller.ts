import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { MaterialsService } from './materials.service'
import { CreateMaterialDto } from './dto/create-material.dto'
import { UpdateMaterialDto } from './dto/update-material.dto'
import {
  MaterialClassroomRepository,
  MaterialRepository,
  MaterialShareRepository
} from './repository/material.repository'

@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly materialRepository: MaterialRepository,
    private readonly materialShareRepository: MaterialShareRepository,
    private readonly materialClassroomRepository: MaterialClassroomRepository
  ) {}

  @Post()
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto)
  }

  @Get()
  findAll() {
    return this.materialsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(+id, updateMaterialDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialsService.remove(+id)
  }
}
