import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const ParticipantIntegritySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    awaySessionCount: {
      type: Number,
      default: 0,
    },
    totalAwayTimeMs: {
      type: Number,
      default: 0,
    },
    longestAwaySessionMs: {
      type: Number,
      default: 0,
    },
    fullscreenExitCount: {
      type: Number,
      default: 0,
    },
    integrityScore: {
      type: Number,
      default: 0,
    },
    currentStatus: {
      type: String,
      enum: ['NORMAL', 'REVIEW', 'SUSPICIOUS', 'HIGH_ALERT'],
      default: 'NORMAL',
    },
    currentlyAway: {
      type: Boolean,
      default: false,
    },
    currentAwayStartedAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    isSubmissionsLocked: {
      type: Boolean,
      default: false,
    },
    notes: [
      {
        adminId: { type: Schema.Types.ObjectId, ref: 'User' },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    collection: 'participant_integrity',
    strict: true,
    timestamps: true,
  }
);

export type ParticipantIntegrityDocument = InferSchemaType<typeof ParticipantIntegritySchema>;

const ParticipantIntegrity =
  (mongoose.models.ParticipantIntegrity as Model<ParticipantIntegrityDocument> | undefined) ||
  mongoose.model<ParticipantIntegrityDocument>('ParticipantIntegrity', ParticipantIntegritySchema);

export default ParticipantIntegrity;
