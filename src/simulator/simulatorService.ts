import { env } from '../config/env';
import { IncidentEvent, TelemetryEvent } from '../domain/models';
import { kafkaProducer } from '../infrastructure/kafka/producer';
import { Repositories } from '../services/repositoryFactory';
import { logger } from '../utils/logger';
import { calculateRiskScore, generateIncidentEvent, generateTelemetryEvent, shouldGenerateIncident } from './eventGenerator';

interface SegmentSeed {
  segmentId: string;
  region: string;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SimulatorService {
  constructor(
    private readonly repositories: Repositories | null,
    private readonly segments: SegmentSeed[]
  ) {}

  public async run(): Promise<never> {
    if (env.simulatorMode !== 'console') {
      await kafkaProducer.connect();
    }
    logger.info({ mode: env.simulatorMode }, 'Simulator started');

    while (true) {
      const segment = this.segments[Math.floor(Math.random() * this.segments.length)];
      if (!segment) {
        throw new Error('No segments available for simulation');
      }

      const telemetry = generateTelemetryEvent(segment.segmentId, segment.region);
      const riskScore = calculateRiskScore(telemetry);
      await this.publishTelemetry(telemetry, riskScore);

      if (shouldGenerateIncident(riskScore, env.simulatorIncidentProbability)) {
        const incident = generateIncidentEvent(segment.segmentId, segment.region, riskScore);
        await this.publishIncident(incident);
      }
      logger.debug({ segmentId: segment.segmentId, riskScore }, 'Simulator tick');

      const delay = Math.floor(
        env.simulatorMinIntervalMs + Math.random() * (env.simulatorMaxIntervalMs - env.simulatorMinIntervalMs)
      );
      await sleep(delay);
    }
  }

  private async publishTelemetry(event: TelemetryEvent, riskScore: number): Promise<void> {
    if (env.simulatorMode === 'kafka' || env.simulatorMode === 'kafka+mongo') {
      await kafkaProducer.publish(env.kafkaTelemetryTopic, event);
    }
    if (env.simulatorMode === 'kafka+mongo' && this.repositories) {
      await this.repositories.telemetryRepository.insertOne(event);
    }
    if (env.simulatorMode === 'console') {
      logger.info({ telemetry: event, riskScore }, 'Telemetry event (console mode)');
    } else {
      logger.debug({ eventId: event.eventId, topic: env.kafkaTelemetryTopic, riskScore }, 'Telemetry event published');
    }
  }

  private async publishIncident(event: IncidentEvent): Promise<void> {
    if (env.simulatorMode === 'kafka' || env.simulatorMode === 'kafka+mongo') {
      await kafkaProducer.publish(env.kafkaIncidentsTopic, event);
    }
    if (env.simulatorMode === 'kafka+mongo' && this.repositories) {
      await this.repositories.incidentRepository.insertOne(event);
    }
    if (env.simulatorMode === 'console') {
      logger.info({ incident: event }, 'Incident event (console mode)');
    } else {
      logger.info({ incidentId: event.incidentId, topic: env.kafkaIncidentsTopic }, 'Incident emitted');
    }
  }
}
