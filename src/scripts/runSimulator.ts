import { env } from '../config/env';
import { kafkaProducer } from '../infrastructure/kafka/producer';
import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { SimulatorService } from '../simulator/simulatorService';
import { createRepositories } from '../services/repositoryFactory';
import { logger } from '../utils/logger';

const defaultSegments = [
  { segmentId: 'SEG-101', region: 'north' },
  { segmentId: 'SEG-102', region: 'north' },
  { segmentId: 'SEG-201', region: 'south' },
  { segmentId: 'SEG-301', region: 'west' }
];

const run = async (): Promise<void> => {
  const db = await connectMongo();
  const repositories = createRepositories(db);

  const segments = await repositories.roadSegmentRepository.find({}, { limit: 100 });
  const seeds =
    segments.length > 0
      ? segments.map((segment) => ({ segmentId: segment.segmentId, region: segment.region }))
      : defaultSegments;

  logger.info(
    { topicTelemetry: env.kafkaTelemetryTopic, topicIncidents: env.kafkaIncidentsTopic, segments: seeds.length },
    'Starting simulator loop'
  );

  const simulatorService = new SimulatorService(repositories, seeds);

  const shutdown = async (): Promise<void> => {
    logger.info('Simulator shutting down');
    await kafkaProducer.disconnect();
    await closeMongo();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await simulatorService.run();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Simulator crashed');
  process.exit(1);
});
