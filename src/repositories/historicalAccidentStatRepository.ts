import { Db } from 'mongodb';
import { COLLECTIONS, DEFAULT_LIMIT } from '../config/constants';
import { HistoricalAccidentStat } from '../domain/models';
import { BaseRepository } from './baseRepository';

export class HistoricalAccidentStatRepository extends BaseRepository<HistoricalAccidentStat> {
  constructor(db: Db) {
    super(db, COLLECTIONS.historicalAccidentStats);
  }

  public async findRecent(limit = DEFAULT_LIMIT): Promise<HistoricalAccidentStat[]> {
    return this.find({}, { sort: { date: -1 }, limit });
  }
}
