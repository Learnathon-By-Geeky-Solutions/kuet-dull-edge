import * as mongoose from 'mongoose'

export const RouteRateLimitSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: true,
      unique: true,
      description: 'The HTTP route this rate limit applies to.'
    },
    windowMs: {
      type: Number,
      required: true,
      description: 'Time window in milliseconds for counting requests.'
    },
    max: {
      type: Number,
      required: true,
      description: 'Maximum number of requests allowed within the window.'
    },
    message: {
      type: String,
      required: false,
      description: 'Optional message returned when the rate limit is exceeded.'
    }
  },
  { timestamps: true }
)
