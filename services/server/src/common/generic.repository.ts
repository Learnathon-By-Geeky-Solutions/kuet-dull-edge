import { Logger } from '@nestjs/common'
import {
  ClientSession,
  Document,
  FilterQuery,
  Model,
  PipelineStage,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateWriteOpResult
} from 'mongoose'

export class GenericRepository<T extends Document> {
  private readonly logger: Logger

  constructor(private readonly model: Model<T>) {
    this.logger = new Logger(this.constructor.name)
  }

  /**
   * Create a new document
   * @param doc Document data
   * @param session Optional MongoDB session for transactions
   * @returns Created document or null on error
   */
  async create(doc: Partial<T>, session?: ClientSession): Promise<T | null> {
    try {
      const createdEntity = new this.model(doc)
      return await createdEntity.save({ session })
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
   * @param session Optional MongoDB session for transactions
   * @returns Created documents or null on error
   */
  async createMany(docs: Partial<T>[], session?: ClientSession): Promise<T[] | null> {
    try {
      return (await this.model.insertMany(docs, { session })) as unknown as T[]
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
   * @param session Optional MongoDB session for transactions
   * @returns Array of documents or null on error
   */
  async findAll(filter: FilterQuery<T> = {}, options: QueryOptions = {}, session?: ClientSession): Promise<T[] | null> {
    try {
      return await this.model.find(filter, null, { ...options, session }).exec()
    } catch (error) {
      this.logger.error(`Error finding documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Find one document matching the filter
   * @param filter Query filter
   * @param options Query options
   * @param session Optional MongoDB session for transactions
   * @returns Document or null if not found
   */
  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}, session?: ClientSession): Promise<T | null> {
    try {
      return await this.model.findOne(filter, null, { ...options, session }).exec()
    } catch (error) {
      this.logger.error(`Error finding document: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Find document by ID
   * @param id Document ID
   * @param options Query options
   * @param session Optional MongoDB session for transactions
   * @returns Document or null if not found
   */
  async findById(id: Types.ObjectId, options: QueryOptions = {}, session?: ClientSession): Promise<T | null> {
    try {
      const document = await this.model.findById(id, null, { ...options, session }).exec()
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
   * @param session Optional MongoDB session for transactions
   * @returns Updated document or null if not found
   */
  async update(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = {},
    session?: ClientSession
  ): Promise<T | null> {
    try {
      const document = await this.model.findOneAndUpdate(filter, update, { new: true, ...options, session }).exec()

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
   * @param session Optional MongoDB session for transactions
   * @returns Result with count of modified documents or null on error
   */
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: ClientSession
  ): Promise<UpdateWriteOpResult | null> {
    try {
      return await this.model.updateMany(filter, update, { session }).exec()
    } catch (error) {
      this.logger.error(`Error updating multiple documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Delete a document
   * @param filter Query filter
   * @param session Optional MongoDB session for transactions
   * @returns True if document was deleted, false otherwise
   */
  async delete(filter: FilterQuery<T>, session?: ClientSession): Promise<boolean> {
    try {
      const result = await this.model.deleteOne(filter, { session }).exec()
      return result.deletedCount > 0
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`, error.stack)
      return false
    }
  }

  /**
   * Delete many documents at once
   * @param filter Query filter
   * @param session Optional MongoDB session for transactions
   * @returns Number of deleted documents or null on error
   */
  async deleteMany(filter: FilterQuery<T>, session?: ClientSession): Promise<number | null> {
    try {
      const result = await this.model.deleteMany(filter, { session }).exec()
      return result.deletedCount
    } catch (error) {
      this.logger.error(`Error deleting multiple documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Count documents matching a filter
   * @param filter Query filter
   * @param session Optional MongoDB session for transactions
   * @returns Count of matching documents or null on error
   */
  async count(filter: FilterQuery<T> = {}, session?: ClientSession): Promise<number | null> {
    try {
      return await this.model.countDocuments(filter, { session }).exec()
    } catch (error) {
      this.logger.error(`Error counting documents: ${error.message}`, error.stack)
      return null
    }
  }

  /**
   * Execute an aggregation pipeline
   * @param pipeline Aggregation pipeline stages
   * @param session Optional MongoDB session for transactions
   * @returns Aggregation result or null on error
   */
  async aggregate<R = any>(pipeline: PipelineStage[], session?: ClientSession): Promise<R[] | null> {
    try {
      return await this.model.aggregate<R>(pipeline).session(session).exec()
    } catch (error) {
      this.logger.error(`Error executing aggregation: ${error.message}`, error.stack)
      return null
    }
  }
}
