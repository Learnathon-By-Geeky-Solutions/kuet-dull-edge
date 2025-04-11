import { Types } from 'mongoose'
import { MaterialOwner, MaterialStatus } from '../enums'

/*
 * If uploaded to classroom - the classroom wii be the owner
 * If uploaded to user - the user will be the owner
 * Ownership changing is not allowed
 *
 * User can only share materials with other users
 * Classrooms can make a material public and share with other classrooms, no one to one sharing
 *
 *
 * Tags are very important - for grouping items
 *
 * Should We go for a role based access
 * 1. SEE_ALL_MATERIALS = 1<<30 , something like that - this one's cheaper, idea re usable to routine events
 * 2. or give access to specific roles
 *
 * Need to design reoutine too - evnts on calendar, persistent with exceptions??
 * 1. CR /Owner
 * 2. Teacher
 */

export interface IMaterial {
  _id: Types.ObjectId
  name: string
  description?: string
  fileType: string
  fileSize: number // in bytes
  filePath: string // S3 path
  createdAt: Date
  lastModified: Date

  // Ownership info
  ownerId: Types.ObjectId // User or classroom that owns the material
  classOwnerId?: Types.ObjectId // Classroom ID if owner is a classroom
  ownerType: MaterialOwner // Type of owner
  uploaderId: Types.ObjectId // Always a user ID who uploaded the file
  deleted?: boolean

  tags?: string[]
  isPublic?: boolean
}

export interface IMaterialClassroom {
  _id: Types.ObjectId
  materialId: Types.ObjectId
  classroomId: Types.ObjectId
  addedBy: Types.ObjectId // User ID who added this to classroom
  status: MaterialStatus
  addedAt: Date
}

export interface IMaterialShare {
  _id: Types.ObjectId
  materialId: Types.ObjectId
  sharedBy: Types.ObjectId // User who shared
  sharedWith: Types.ObjectId // User who receives
  sharedAt: Date
  accessLevel: 'view' | 'edit' // Permission level
  status: 'active' | 'revoked'
}

export interface IStorageUsage {
  _id: Types.ObjectId
  entityId: Types.ObjectId // User or classroom ID
  entityType: 'user' | 'classroom'
  totalStorage: number // Total bytes used
  fileCount: number // Number of files
  lastUpdated: Date
  storageLimit: number // Maximum allowed storage
}
