import { createServer } from 'http';
import { env } from './config/env';
import { closeMongo, connectMongo } from './infrastructure/mongo/client';
import { createRepositories } from './services/repositoryFactory';
import { createApp } from './app';
import { logger } from './utils/logger';
import { kafkaProducer } from './infrastructure/kafka/producer';

const bootstrap = async (): Promise<void> => {
  const db = await connectMongo();
  const repositories = createRepositories(db);
  const app = createApp(repositories);

  const server = createServer(app);
  server.listen(env.port, () => {
    logger.info({ port: env.port }, 'Server started');
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down application');
    server.close();
    await kafkaProducer.disconnect();
    await closeMongo();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch((error: Error) => {
  logger.error({ err: error }, 'Failed to start application');
  process.exit(1);
});
