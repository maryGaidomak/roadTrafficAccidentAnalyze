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

  public async findByRegionAndRange(region?: string, from?: Date, to?: Date): Promise<HistoricalAccidentStat[]> {
    const filter: {
      region?: string;
      date?: { $gte?: string; $lte?: string };
    } = {};

    if (region) {
      filter.region = region;
    }

    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = from.toISOString().slice(0, 10);
      }
      if (to) {
        filter.date.$lte = to.toISOString().slice(0, 10);
      }
    }

    return this.find(filter, { sort: { date: -1 }, limit: DEFAULT_LIMIT * 10 });
  }
}
