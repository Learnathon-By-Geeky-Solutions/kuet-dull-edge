import { Types } from 'mongoose'

/*
 * If uploaded to classroom - the classroom wii be the owner
 * If uploaded to user - the user will be the owner
 * Ownership changing is not allowed
 *
 * User can only share materials with other users
 * Classrooms can make a material public and share with other classrooms, no one to one sharing
 */

export interface IMaterial {
  _id: Types.ObjectId
  name: string
  description?: string
  fileType: string
  fileSize: number // in bytes
  filePath: string // S3 path
  uploadedAt: Date
  lastModified: Date

  // Ownership info
  ownerId: Types.ObjectId // User or classroom that owns the material
  classOwnerId?: Types.ObjectId // Classroom ID if owner is a classroom
  ownerType: 'user' | 'classroom' // Type of owner
  uploaderId: Types.ObjectId // Always a user ID who uploaded the file

  tags?: string[]
  isPublic: boolean
}

export interface IMaterialClassroom {
  _id: Types.ObjectId
  materialId: Types.ObjectId
  classroomId: Types.ObjectId
  addedBy: Types.ObjectId // User ID who added this to classroom
  addedAt: Date
  status: 'active' | 'archived' | 'removed'
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
