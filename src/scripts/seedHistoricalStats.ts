import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { COLLECTIONS } from '../config/constants';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection(COLLECTIONS.historicalAccidentStats);
  const now = new Date();

  // Demo data for coursework scenarios (not official statistics).
  const sample = [
    { region: 'Moscow', date: '2026-03-25', accidentsCount: 19, injuriesCount: 17, fatalitiesCount: 1 },
    { region: 'Moscow', date: '2026-03-26', accidentsCount: 16, injuriesCount: 13, fatalitiesCount: 1 },
    { region: 'Moscow Oblast', date: '2026-03-25', accidentsCount: 14, injuriesCount: 10, fatalitiesCount: 1 },
    { region: 'Saint Petersburg', date: '2026-03-26', accidentsCount: 11, injuriesCount: 8, fatalitiesCount: 0 },
    { region: 'Tatarstan', date: '2026-03-25', accidentsCount: 9, injuriesCount: 6, fatalitiesCount: 0 },
    { region: 'Krasnodar Krai', date: '2026-03-26', accidentsCount: 12, injuriesCount: 9, fatalitiesCount: 1 }
  ];

  await collection.deleteMany({ date: { $in: sample.map((item) => item.date) }, region: { $in: sample.map((item) => item.region) } });
  await collection.insertMany(sample.map((item) => ({ ...item, event_time: new Date(`${item.date}T00:00:00.000Z`), updatedAt: now })));

  logger.info('Historical stats demo data seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Historical stats seed failed');
  process.exit(1);
});
