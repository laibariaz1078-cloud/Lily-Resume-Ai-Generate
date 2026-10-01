import mongoose from 'mongoose';
import { env } from './env';
import { AIUsage } from '../models/ai-usage.model';
import { ResumeAnalysis } from '../models/resume-analysis.model';
import { Resume } from '../models/resume.model';
import { ResumeVersion } from '../models/resume-version.model';
import { Subscription } from '../models/subscription.model';
import { Template } from '../models/template.model';
import { User } from '../models/user.model';

mongoose.set('sanitizeFilter', true);

export async function connectDatabase(): Promise<void> {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      autoIndex: env.NODE_ENV !== 'production',
    });
    await connection.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await Promise.all([
      User.createIndexes(),
      AIUsage.createIndexes(),
      Resume.createIndexes(),
      ResumeVersion.createIndexes(),
      ResumeAnalysis.createIndexes(),
      Subscription.createIndexes(),
      Template.createIndexes(),
    ]);

    if (env.NODE_ENV !== 'production') {
      console.info(`MongoDB connected (${connection.connection.name})`);
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    console.error(`MongoDB connection failed (${errorName}). Check MONGODB_URI and database availability.`);
    throw new Error('Database connection failed');
  }
}
