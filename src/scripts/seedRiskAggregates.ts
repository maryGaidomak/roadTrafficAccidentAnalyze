import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { COLLECTIONS } from '../config/constants';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection(COLLECTIONS.riskAggregates);
  const now = new Date();

  const riskRows = [
    { segmentId: 'SEG-101', region: 'Moscow', riskScore: 0.72, incidentCountLast24h: 6, avgSpeedLastHour: 42 },
    { segmentId: 'SEG-102', region: 'Moscow', riskScore: 0.59, incidentCountLast24h: 4, avgSpeedLastHour: 49 },
    { segmentId: 'SEG-201', region: 'Moscow Oblast', riskScore: 0.67, incidentCountLast24h: 5, avgSpeedLastHour: 45 },
    { segmentId: 'SEG-301', region: 'Saint Petersburg', riskScore: 0.46, incidentCountLast24h: 2, avgSpeedLastHour: 58 },
    { segmentId: 'SEG-401', region: 'Tatarstan', riskScore: 0.64, incidentCountLast24h: 3, avgSpeedLastHour: 47 }
  ];

  await collection.deleteMany({ segmentId: { $in: riskRows.map((row) => row.segmentId) } });
  await collection.insertMany(riskRows.map((row) => ({ ...row, windowEnd: now, updatedAt: now })));

  logger.info('Risk aggregates demo data seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Risk aggregates seed failed');
  process.exit(1);
});
