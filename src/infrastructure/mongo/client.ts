import { Db, MongoClient } from 'mongodb';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectMongo = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.mongoDbName);
  logger.info({ db: env.mongoDbName }, 'MongoDB connected');
  return db;
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('MongoDB not connected');
  }
  return db;
};

export const closeMongo = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
};
