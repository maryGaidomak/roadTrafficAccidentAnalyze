import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { initializeMongoIndexes } from '../infrastructure/mongo/indexInitializer';
import { StreamProcessor } from '../processor/streamProcessor';
import { logger } from '../utils/logger';

const run = async (): Promise<void> => {
  const db = await connectMongo();
  logger.info('Processor Mongo connected');

  await initializeMongoIndexes(db);

  const processor = new StreamProcessor(db);

  const shutdown = async (): Promise<void> => {
    logger.info('Processor shutting down');
    await processor.stop();
    await closeMongo();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await processor.run();
};

run().catch((error: Error) => {
  logger.error({ err: error }, 'Processor crashed');
  process.exit(1);
});
