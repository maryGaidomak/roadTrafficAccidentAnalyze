import { Kafka } from 'kafkajs';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const requiredTopics = [env.kafkaTelemetryTopic, env.kafkaIncidentsTopic];

let topicsInitialized = false;

export const ensureKafkaTopics = async (): Promise<void> => {
  if (topicsInitialized) {
    return;
  }

  const kafka = new Kafka({
    clientId: `${env.kafkaClientId}-topic-manager`,
    brokers: env.kafkaBrokers
  });

  const admin = kafka.admin();

  try {
    await admin.connect();
    await admin.createTopics({
      waitForLeaders: true,
      topics: requiredTopics.map((topic) => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1
      }))
    });

    topicsInitialized = true;
    logger.info({ topics: requiredTopics }, 'Kafka topics ensured');
  } finally {
    await admin.disconnect();
  }
};
