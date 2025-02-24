import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { Model, Types, Connection, connect } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { UserPeek, UserPeekSchema } from '../../../src/modules/users/schemas/user-peek.schema'
import { UserPeekService } from '../../../src/modules/users/services/user-peek.service'
import { InternalServerErrorException } from '@nestjs/common'

describe('UserPeekService', () => {
  let service: UserPeekService
  let mongod: MongoMemoryServer
  let mongoConnection: Connection
  let userPeekModel: Model<UserPeek>

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    mongoConnection = (await connect(uri)).connection
    userPeekModel = mongoConnection.model<UserPeek>('UserPeek', UserPeekSchema)
  })

  afterAll(async () => {
    await mongoConnection.dropDatabase()
    await mongoConnection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPeekService,
        {
          provide: getModelToken(UserPeek.name),
          useValue: userPeekModel
        }
      ]
    }).compile()

    service = module.get<UserPeekService>(UserPeekService)
  })

  afterEach(async () => {
    const collections = mongoConnection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  })

  describe('createUserPeek', () => {
    it('should create a new user peek successfully', async () => {
      const userPeekData = {
        username: 'testuser',
        name: 'Test User'
      }

      const result = await service.createUserPeek(userPeekData)
      expect(result.username).toBe(userPeekData.username)
      expect(result.name).toBe(userPeekData.name)
    })

    it('should create user peek with custom _id', async () => {
      const customId = new Types.ObjectId()
      const userPeekData = {
        _id: customId,
        username: 'testuser',
        name: 'Test User'
      }

      const result = await service.createUserPeek(userPeekData)
      expect(result._id).toEqual(customId)
    })

    it('should throw InternalServerErrorException on save error', async () => {
      jest.spyOn(userPeekModel.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'))

      await expect(
        service.createUserPeek({
          username: 'testuser',
          name: 'Test User'
        })
      ).rejects.toThrow(InternalServerErrorException)
    })

    it('should handle duplicate username error', async () => {
      const userPeekData = {
        username: 'testuser',
        name: 'Test User'
      }

      await service.createUserPeek(userPeekData)

      await expect(service.createUserPeek(userPeekData)).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const userPeek = await userPeekModel.create({
        username: 'testuser',
        name: 'Test User'
      })

      const result = await service.findByUsername('testuser')
      expect(result.username).toBe(userPeek.username)
    })

    it('should return null if username not found', async () => {
      const result = await service.findByUsername('nonexistent')
      expect(result).toBeNull()
    })

    it('should handle case sensitive search correctly', async () => {
      await userPeekModel.create({
        username: 'TestUser',
        name: 'Test User'
      })

      const result = await service.findByUsername('testuser')
      expect(result).toBeNull()
    })
  })

  describe('updateUserPeek', () => {
    it('should update user peek successfully', async () => {
      const userPeek = await userPeekModel.create({
        username: 'testuser',
        name: 'Test User'
      })

      const updatedData = {
        name: 'Updated Name',
        photo: 'http://example.com/photo.jpg'
      }

      const result = await service.updateUserPeek(userPeek._id.toString(), updatedData)
      expect(result.name).toBe(updatedData.name)
      expect(result.photo).toBe(updatedData.photo)
    })

    it('should maintain existing fields when updating partially', async () => {
      const userPeek = await userPeekModel.create({
        username: 'testuser',
        name: 'Test User',
        photo: 'http://example.com/old-photo.jpg'
      })

      const result = await service.updateUserPeek(userPeek._id.toString(), { name: 'Updated Name' })
      expect(result.name).toBe('Updated Name')
      expect(result.photo).toBe('http://example.com/old-photo.jpg')
      expect(result.username).toBe('testuser')
    })
  })
})
