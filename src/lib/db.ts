import mongoose from 'mongoose';

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error('Please define the MONGODB_URI environment variable.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  cached.promise ??= mongoose.connect(mongodbUri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  cached.conn = await cached.promise;

  return cached.conn;
}

export default connectDB;
