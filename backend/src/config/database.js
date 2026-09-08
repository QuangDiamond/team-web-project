import mongoose from 'mongoose';
import { env } from './environment.js';

export async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  try {
    await mongoose.connect(env.mongodbUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

export function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
