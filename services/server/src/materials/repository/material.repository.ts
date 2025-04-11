import { MaterialShare } from './material-share.schema'
import { MaterialClassroom } from './material-classroom.schema'
import { Material } from './material.schema'
import { StorageUsage } from './storage-usage.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { GenericRepository } from '../../common/repository/generic.repository'

export class MaterialRepository extends GenericRepository<Material> {
  constructor(
    @InjectModel(Material.name) private readonly materialModel: Model<Material>
  ) {
    super(materialModel)
  }
}

export class MaterialShareRepository extends GenericRepository<MaterialShare> {
  constructor(
    @InjectModel(MaterialShare.name)
    private readonly materialShareModel: Model<MaterialShare>
  ) {
    super(materialShareModel)
  }
}

export class MaterialClassroomRepository extends GenericRepository<MaterialClassroom> {
  constructor(
    @InjectModel(MaterialClassroom.name)
    private readonly materialClassroomModel: Model<MaterialClassroom>
  ) {
    super(materialClassroomModel)
  }
}

export class StorageUsageRepository extends GenericRepository<StorageUsage> {
  constructor(
    @InjectModel(StorageUsage.name)
    private readonly storageUsageModel: Model<StorageUsage>
  ) {
    super(storageUsageModel)
  }
}
