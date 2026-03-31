import { Db } from 'mongodb';
import { COLLECTIONS, DEFAULT_LIMIT } from '../config/constants';
import { TelemetryEvent } from '../domain/models';
import { BaseRepository } from './baseRepository';

export class TelemetryRepository extends BaseRepository<TelemetryEvent> {
  constructor(db: Db) {
    super(db, COLLECTIONS.telemetryEvents);
  }

  public async findRecent(limit = DEFAULT_LIMIT): Promise<TelemetryEvent[]> {
    return this.find({}, { sort: { timestamp: -1 }, limit });
  }

  public async countLast24h(since: Date): Promise<number> {
    return this.collection.countDocuments({ timestamp: { $gte: since } });
  }
}
