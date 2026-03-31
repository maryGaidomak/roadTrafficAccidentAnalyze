import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { COLLECTIONS } from '../config/constants';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection(COLLECTIONS.roadSegments);
  const now = new Date();

  await collection.deleteMany({ segmentId: { $in: ['SEG-101', 'SEG-102', 'SEG-201', 'SEG-301', 'SEG-401'] } });
  await collection.insertMany([
    {
      segmentId: 'SEG-101',
      region: 'north',
      name: 'Northern Highway A',
      startPoint: { lat: 55.76, lon: 37.61 },
      endPoint: { lat: 55.8, lon: 37.7 },
      speedLimit: 80,
      lanes: 3,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-102',
      region: 'north',
      name: 'Ring Connector N2',
      startPoint: { lat: 55.79, lon: 37.58 },
      endPoint: { lat: 55.83, lon: 37.66 },
      speedLimit: 70,
      lanes: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-201',
      region: 'south',
      name: 'South Transit Artery',
      startPoint: { lat: 55.68, lon: 37.62 },
      endPoint: { lat: 55.63, lon: 37.71 },
      speedLimit: 90,
      lanes: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-301',
      region: 'west',
      name: 'West Industrial Bypass',
      startPoint: { lat: 55.76, lon: 37.4 },
      endPoint: { lat: 55.71, lon: 37.48 },
      speedLimit: 60,
      lanes: 2,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-401',
      region: 'east',
      name: 'East Suburban Route',
      startPoint: { lat: 55.77, lon: 37.77 },
      endPoint: { lat: 55.74, lon: 37.86 },
      speedLimit: 75,
      lanes: 3,
      createdAt: now,
      updatedAt: now
    }
  ]);

  logger.info('Road segments seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Road segments seed failed');
  process.exit(1);
});
