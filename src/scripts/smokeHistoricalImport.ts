import { COLLECTIONS } from '../config/constants';
import { connectMongo, closeMongo } from '../infrastructure/mongo/client';

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection(COLLECTIONS.historicalAccidentStats);

  const totalRecords = await collection.countDocuments({});
  if (totalRecords === 0) {
    throw new Error('historical_accident_stats is empty. Import or seed data first.');
  }

  const response = await fetch(`${baseUrl}/api/stats/historical`);
  if (!response.ok) {
    throw new Error(`/api/stats/historical responded with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('/api/stats/historical returned empty payload');
  }

  console.log(`OK historical collection has ${totalRecords} records`);
  console.log(`OK /api/stats/historical returned ${payload.length} records`);

  await closeMongo();
};

run().catch(async (error: Error) => {
  console.error('Historical import smoke check failed:', error.message);
  await closeMongo();
  process.exit(1);
});

export {};
