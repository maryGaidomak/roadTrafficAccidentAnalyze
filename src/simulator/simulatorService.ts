import { env } from '../config/env';
import { IncidentEvent, TelemetryEvent } from '../domain/models';
import { kafkaProducer } from '../infrastructure/kafka/producer';
import { Repositories } from '../services/repositoryFactory';
import { logger } from '../utils/logger';
import { generateIncidentEvent, generateTelemetryEvent } from './eventGenerator';

interface SegmentSeed {
  segmentId: string;
  region: string;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SimulatorService {
  constructor(
    private readonly repositories: Repositories,
    private readonly segments: SegmentSeed[]
  ) {}

  public async run(): Promise<never> {
    await kafkaProducer.connect();
    logger.info('Simulator started');

    while (true) {
      const segment = this.segments[Math.floor(Math.random() * this.segments.length)];
      if (!segment) {
        throw new Error('No segments available for simulation');
      }

      const telemetry = generateTelemetryEvent(segment.segmentId, segment.region);
      await this.publishTelemetry(telemetry);

      if (Math.random() <= env.simulatorIncidentProbability) {
        const incident = generateIncidentEvent(segment.segmentId, segment.region);
        await this.publishIncident(incident);
      }

      const delay = Math.floor(
        env.simulatorMinIntervalMs + Math.random() * (env.simulatorMaxIntervalMs - env.simulatorMinIntervalMs)
      );
      await sleep(delay);
    }
  }

  private async publishTelemetry(event: TelemetryEvent): Promise<void> {
    await kafkaProducer.publish(env.kafkaTelemetryTopic, event);
    if (env.simulatorWriteToMongo) {
      await this.repositories.telemetryRepository.insertOne(event);
    }
    logger.debug({ eventId: event.eventId, topic: env.kafkaTelemetryTopic }, 'Telemetry event published');
  }

  private async publishIncident(event: IncidentEvent): Promise<void> {
    await kafkaProducer.publish(env.kafkaIncidentsTopic, event);
    if (env.simulatorWriteToMongo) {
      await this.repositories.incidentRepository.insertOne(event);
    }
    logger.debug({ incidentId: event.incidentId, topic: env.kafkaIncidentsTopic }, 'Incident event published');
  }
}
