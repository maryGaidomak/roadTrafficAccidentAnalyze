import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { Db } from 'mongodb';
import { env } from '../config/env';
import { COLLECTIONS } from '../config/constants';
import { IncidentEvent, RiskAggregate, TelemetryEvent } from '../domain/models';
import { isIncidentEventPayload, isTelemetryEventPayload } from './messageValidation';
import { recalculateRiskAggregate } from './riskAggregateUpdater';
import { logger } from '../utils/logger';
import { ensureKafkaTopics } from '../infrastructure/kafka/topicManager';

export class StreamProcessor {
  private readonly consumer: Consumer;

  constructor(private readonly db: Db) {
    const kafka = new Kafka({
      clientId: `${env.kafkaClientId}-processor`,
      brokers: env.kafkaBrokers
    });
    this.consumer = kafka.consumer({ groupId: 'road-traffic-processor-group' });
  }

  public async run(): Promise<void> {
    await ensureKafkaTopics();
    await this.consumer.connect();
    logger.info('Processor Kafka connected');

    await this.consumer.subscribe({ topic: env.kafkaTelemetryTopic, fromBeginning: false });
    await this.consumer.subscribe({ topic: env.kafkaIncidentsTopic, fromBeginning: false });
    logger.info({ topics: [env.kafkaTelemetryTopic, env.kafkaIncidentsTopic] }, 'Processor subscribed topics');
    logger.info('Stream processor started');

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      }
    });

  }

  public async stop(): Promise<void> {
    await this.consumer.disconnect();
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    const rawValue = message.value?.toString();
    if (!rawValue) {
      logger.warn({ topic, offset: message.offset }, 'Skip empty Kafka message');
      return;
    }

    try {
      const payload: unknown = JSON.parse(rawValue);
      if (topic === env.kafkaTelemetryTopic) {
        await this.processTelemetryEvent(payload, message.offset);
        return;
      }

      if (topic === env.kafkaIncidentsTopic) {
        await this.processIncidentEvent(payload, message.offset);
      }
    } catch (error) {
      logger.error({ err: error, topic, offset: message.offset }, 'Failed to process Kafka message');
    }
  }

  private async processTelemetryEvent(payload: unknown, offset: string): Promise<void> {
    if (!isTelemetryEventPayload(payload)) {
      logger.warn({ topic: env.kafkaTelemetryTopic, offset, payload }, 'Invalid telemetry payload, skipped');
      return;
    }

    const telemetryCollection = this.db.collection<TelemetryEvent>(COLLECTIONS.telemetryEvents);
    const incidentCollection = this.db.collection<IncidentEvent>(COLLECTIONS.incidentEvents);
    const riskCollection = this.db.collection<RiskAggregate>(COLLECTIONS.riskAggregates);

    await telemetryCollection.updateOne(
      { eventId: payload.eventId },
      {
        $setOnInsert: {
          ...payload,
          timestamp: new Date(payload.timestamp)
        }
      },
      { upsert: true }
    );

    await recalculateRiskAggregate(payload.segmentId, telemetryCollection, incidentCollection, riskCollection);
    logger.info({ eventId: payload.eventId, segmentId: payload.segmentId, offset }, 'Telemetry message processed');
  }

  private async processIncidentEvent(payload: unknown, offset: string): Promise<void> {
    if (!isIncidentEventPayload(payload)) {
      logger.warn({ topic: env.kafkaIncidentsTopic, offset, payload }, 'Invalid incident payload, skipped');
      return;
    }

    const telemetryCollection = this.db.collection<TelemetryEvent>(COLLECTIONS.telemetryEvents);
    const incidentCollection = this.db.collection<IncidentEvent>(COLLECTIONS.incidentEvents);
    const riskCollection = this.db.collection<RiskAggregate>(COLLECTIONS.riskAggregates);

    await incidentCollection.updateOne(
      { incidentId: payload.incidentId },
      {
        $setOnInsert: {
          ...payload,
          timestamp: new Date(payload.timestamp)
        }
      },
      { upsert: true }
    );

    await recalculateRiskAggregate(payload.segmentId, telemetryCollection, incidentCollection, riskCollection);
    logger.info({ incidentId: payload.incidentId, segmentId: payload.segmentId, offset }, 'Incident message processed');
  }
}
