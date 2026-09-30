import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('sanitizeFilter', true);

export async function connectDatabase(): Promise<void> {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: env.NODE_ENV !== 'production',
    });
    await connection.connection.collection('users').createIndex({ email: 1 }, { unique: true });

    if (env.NODE_ENV !== 'production') {
      console.info(`MongoDB connected (${connection.connection.name})`);
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.error(`MongoDB connection failed (${errorName}). Check MONGODB_URI and database availability.`);
    throw new Error('Database connection failed');
  }
}
