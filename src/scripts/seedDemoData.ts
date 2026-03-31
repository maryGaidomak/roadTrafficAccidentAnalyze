import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { createRepositories } from '../services/repositoryFactory';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const repositories = createRepositories(db);

  const now = new Date();

  await repositories.roadSegmentRepository.insertOne({
    segmentId: 'SEG-101',
    region: 'north',
    name: 'Northern Highway A',
    startPoint: { lat: 55.76, lon: 37.61 },
    endPoint: { lat: 55.8, lon: 37.7 },
    speedLimit: 80,
    lanes: 3,
    createdAt: now,
    updatedAt: now
  });

  await repositories.riskAggregateRepository.insertOne({
    segmentId: 'SEG-101',
    region: 'north',
    riskScore: 0.73,
    incidentCountLast24h: 4,
    avgSpeedLastHour: 38,
    updatedAt: now
  });

  await repositories.historicalAccidentStatRepository.insertOne({
    region: 'north',
    date: now.toISOString().slice(0, 10),
    accidentsCount: 12,
    injuriesCount: 8,
    fatalitiesCount: 1,
    updatedAt: now
  });

  logger.info('Demo data seeded');
  await closeMongo();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Seeding failed');
  process.exit(1);
});
