import { Db } from 'mongodb';
import { HistoricalAccidentStatRepository } from '../repositories/historicalAccidentStatRepository';
import { IncidentRepository } from '../repositories/incidentRepository';
import { RiskAggregateRepository } from '../repositories/riskAggregateRepository';
import { RoadSegmentRepository } from '../repositories/roadSegmentRepository';
import { TelemetryRepository } from '../repositories/telemetryRepository';

export interface Repositories {
  roadSegmentRepository: RoadSegmentRepository;
  telemetryRepository: TelemetryRepository;
  incidentRepository: IncidentRepository;
  riskAggregateRepository: RiskAggregateRepository;
  historicalAccidentStatRepository: HistoricalAccidentStatRepository;
}

export const createRepositories = (db: Db): Repositories => ({
  roadSegmentRepository: new RoadSegmentRepository(db),
  telemetryRepository: new TelemetryRepository(db),
  incidentRepository: new IncidentRepository(db),
  riskAggregateRepository: new RiskAggregateRepository(db),
  historicalAccidentStatRepository: new HistoricalAccidentStatRepository(db)
});
