import { Db } from 'mongodb';
import { COLLECTIONS, DEFAULT_LIMIT } from '../config/constants';
import { IncidentEvent } from '../domain/models';
import { BaseRepository } from './baseRepository';

export class IncidentRepository extends BaseRepository<IncidentEvent> {
  constructor(db: Db) {
    super(db, COLLECTIONS.incidentEvents);
  }

  public async findRecent(limit = DEFAULT_LIMIT): Promise<IncidentEvent[]> {
    return this.find({}, { sort: { timestamp: -1 }, limit });
  }

  public async countLast24h(since: Date): Promise<number> {
    return this.collection.countDocuments({ timestamp: { $gte: since } });
  }
}
