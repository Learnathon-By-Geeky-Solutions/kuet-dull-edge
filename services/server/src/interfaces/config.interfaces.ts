import { Document } from 'mongoose'

export interface IKeyVal extends Document {
  key: string
  value: string
}

export interface IRouteRateLimit extends Document {
  route: string
  windowMs: number
  max: number
  message?: string
}
