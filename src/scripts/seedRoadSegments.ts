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
      region: 'Moscow',
      name: 'MKAD North Arc',
      startPoint: { lat: 55.887, lon: 37.442 },
      endPoint: { lat: 55.883, lon: 37.567 },
      speedLimit: 100,
      lanes: 5,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-102',
      region: 'Moscow',
      name: 'Leningradsky Prospekt',
      startPoint: { lat: 55.804, lon: 37.515 },
      endPoint: { lat: 55.789, lon: 37.558 },
      speedLimit: 80,
      lanes: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-201',
      region: 'Moscow Oblast',
      name: 'M-7 Volga (Balashikha segment)',
      startPoint: { lat: 55.811, lon: 37.965 },
      endPoint: { lat: 55.803, lon: 38.029 },
      speedLimit: 90,
      lanes: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-301',
      region: 'Saint Petersburg',
      name: 'KAD South-West segment',
      startPoint: { lat: 59.846, lon: 30.232 },
      endPoint: { lat: 59.873, lon: 30.165 },
      speedLimit: 110,
      lanes: 4,
      createdAt: now,
      updatedAt: now
    },
    {
      segmentId: 'SEG-401',
      region: 'Tatarstan',
      name: 'M-7 Kazan bypass',
      startPoint: { lat: 55.779, lon: 49.082 },
      endPoint: { lat: 55.803, lon: 49.197 },
      speedLimit: 90,
      lanes: 3,
      createdAt: now,
      updatedAt: now
    }
  ]);

  logger.info('Road segments demo data seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Road segments seed failed');
  process.exit(1);
});
