import { Db } from 'mongodb';
import { COLLECTIONS } from '../../config/constants';
import { logger } from '../../utils/logger';

export const initializeMongoIndexes = async (db: Db): Promise<void> => {
  await Promise.all([
    db.collection(COLLECTIONS.telemetryEvents).createIndexes([
      { key: { eventId: 1 }, name: 'telemetry_event_id_unique', unique: true },
      { key: { timestamp: -1 }, name: 'telemetry_timestamp_desc' },
      { key: { segmentId: 1, timestamp: -1 }, name: 'telemetry_segment_timestamp' },
      { key: { event_time: -1 }, name: 'telemetry_event_time_desc' }
    ]),
    db.collection(COLLECTIONS.incidentEvents).createIndexes([
      { key: { incidentId: 1 }, name: 'incident_event_id_unique', unique: true },
      { key: { timestamp: -1 }, name: 'incident_timestamp_desc' },
      { key: { segmentId: 1, timestamp: -1 }, name: 'incident_segment_timestamp' },
      { key: { event_time: -1 }, name: 'incident_event_time_desc' }
    ]),
    db.collection(COLLECTIONS.riskAggregates).createIndexes([
      { key: { segmentId: 1 }, name: 'risk_segment' },
      { key: { windowEnd: -1 }, name: 'risk_window_end_desc' },
      { key: { region: 1, riskScore: -1 }, name: 'risk_region_score' }
    ]),
    db.collection(COLLECTIONS.historicalAccidentStats).createIndexes([
      { key: { region: 1, date: -1 }, name: 'historical_region_date' },
      { key: { event_time: -1 }, name: 'historical_event_time_desc' }
    ]),
    db.collection(COLLECTIONS.roadSegments).createIndexes([
      { key: { segmentId: 1 }, name: 'road_segment_id', unique: true },
      { key: { region: 1 }, name: 'road_region' }
    ])
  ]);

  logger.info('MongoDB indexes initialized');
};
