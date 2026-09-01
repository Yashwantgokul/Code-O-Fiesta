import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const IntegrityLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['AWAY_SESSION_START', 'AWAY_SESSION_END', 'ADMIN_ACTION', 'CONNECTION_LOST'],
    },
    awaySessionId: {
      type: String,
      index: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    reasons: {
      type: [String],
      default: [],
    },
    severity: {
      type: String,
      enum: ['NORMAL', 'MINOR', 'SUSPICIOUS', 'HIGH', 'CRITICAL', 'NONE'],
      default: 'NONE',
    },
    details: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'integrity_logs',
    strict: true,
    timestamps: true,
  }
);

IntegrityLogSchema.index({ userId: 1, timestamp: -1 });

export type IntegrityLogDocument = InferSchemaType<typeof IntegrityLogSchema>;

const IntegrityLog =
  (mongoose.models.IntegrityLog as Model<IntegrityLogDocument> | undefined) ||
  mongoose.model<IntegrityLogDocument>('IntegrityLog', IntegrityLogSchema);

export default IntegrityLog;
