import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { COLLECTIONS } from '../config/constants';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection(COLLECTIONS.historicalAccidentStats);
  const now = new Date();

  const sample = [
    { region: 'north', date: '2026-03-25', accidentsCount: 12, injuriesCount: 10, fatalitiesCount: 1 },
    { region: 'north', date: '2026-03-26', accidentsCount: 10, injuriesCount: 7, fatalitiesCount: 0 },
    { region: 'south', date: '2026-03-25', accidentsCount: 9, injuriesCount: 6, fatalitiesCount: 0 },
    { region: 'south', date: '2026-03-26', accidentsCount: 14, injuriesCount: 11, fatalitiesCount: 1 },
    { region: 'west', date: '2026-03-25', accidentsCount: 7, injuriesCount: 3, fatalitiesCount: 0 },
    { region: 'east', date: '2026-03-26', accidentsCount: 11, injuriesCount: 8, fatalitiesCount: 1 }
  ];

  await collection.deleteMany({ date: { $in: sample.map((item) => item.date) } });
  await collection.insertMany(sample.map((item) => ({ ...item, event_time: new Date(`${item.date}T00:00:00.000Z`), updatedAt: now })));

  logger.info('Historical stats seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Historical stats seed failed');
  process.exit(1);
});
