import { ConflictException, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { Document, FilterQuery, Model, QueryOptions, UpdateQuery, UpdateWriteOpResult, PipelineStage } from 'mongoose'

export class GenericRepository<T extends Document> {
  private readonly logger: Logger

  // TODO: implement logging for error cases
  constructor(private readonly model: Model<T>) {
    this.logger = new Logger(this.constructor.name)
  }

  /**
   * Create a new document
   * @param doc Document data
   * @returns Created document or null on error
   */
  async create(doc: Partial<T>): Promise<T | null> {
    try {
      const createdEntity = new this.model(doc)
      return await createdEntity.save()
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(`Duplicate key error: ${JSON.stringify(error.keyValue)}`)
        return null
      }
      this.logger.error(`Error creating document: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Create multiple documents in a single operation
   * @param docs Array of document data
   * @returns Created documents or null on error
   */
  async createMany(docs: Partial<T>[]): Promise<T[] | null> {
    try {
      return (await this.model.insertMany(docs)) as unknown as T[]
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(`Duplicate key error in bulk insert: ${JSON.stringify(error.keyValue)}`)
        return null
      }
      this.logger.error(`Error creating multiple documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Find all documents matching the filter
   * @param filter Query filter
   * @param options Query options
   * @returns Array of documents or null on error
   */
  async findAll(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[] | null> {
    try {
      return await this.model.find(filter, null, options).exec()
    } catch (error) {
      this.logger.error(`Error finding documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Find one document matching the filter
   * @param filter Query filter
   * @param options Query options
   * @returns Document or null if not found
   */
  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    try {
      return await this.model.findOne(filter, null, options).exec()
    } catch (error) {
      this.logger.error(`Error finding document: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Find document by ID
   * @param id Document ID
   * @param options Query options
   * @returns Document or null if not found
   */
  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    try {
      const document = await this.model.findById(id, null, options).exec()
      if (!document) {
        return null
      }
      return document
    } catch (error) {
      this.logger.error(`Error finding document by ID: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Update a document
   * @param filter Query filter
   * @param update Update data
   * @param options Query options
   * @returns Updated document or null if not found
   */
  async update(filter: FilterQuery<T>, update: UpdateQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    try {
      const document = await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec()

      if (!document && options.upsert !== true) {
        this.logger.warn(`No document found to update with filter: ${JSON.stringify(filter)}`)
      }

      return document
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(`Duplicate key error during update: ${JSON.stringify(error.keyValue)}`)
        return null
      }
      this.logger.error(`Error updating document: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Update many documents at once
   * @param filter Query filter
   * @param update Update data
   * @returns Result with count of modified documents or null on error
   */
  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<UpdateWriteOpResult | null> {
    try {
      return await this.model.updateMany(filter, update).exec()
    } catch (error) {
      this.logger.error(`Error updating multiple documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Delete a document
   * @param filter Query filter
   * @returns True if document was deleted, false otherwise
   */
  async delete(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const result = await this.model.deleteOne(filter).exec()
      return result.deletedCount > 0
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`, error.stack)
      return false
    }
  }

  /**
   * Delete many documents at once
   * @param filter Query filter
   * @returns Number of deleted documents or null on error
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number | null> {
    try {
      const result = await this.model.deleteMany(filter).exec()
      return result.deletedCount
    } catch (error) {
      this.logger.error(`Error deleting multiple documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Count documents matching a filter
   * @param filter Query filter
   * @returns Count of matching documents or null on error
   */
  async count(filter: FilterQuery<T> = {}): Promise<number | null> {
    try {
      return await this.model.countDocuments(filter).exec()
    } catch (error) {
      this.logger.error(`Error counting documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Execute an aggregation pipeline
   * @param pipeline Aggregation pipeline stages
   * @returns Aggregation result or null on error
   */
  async aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[] | null> {
    try {
      return await this.model.aggregate<R>(pipeline).exec()
    } catch (error) {
      this.logger.error(`Error executing aggregation: ${error.message}`, error.stack)
      return null
    }
  }
}
