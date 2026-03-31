import { Db } from 'mongodb';
import { COLLECTIONS, DEFAULT_LIMIT } from '../config/constants';
import { RiskAggregate } from '../domain/models';
import { BaseRepository } from './baseRepository';

export class RiskAggregateRepository extends BaseRepository<RiskAggregate> {
  constructor(db: Db) {
    super(db, COLLECTIONS.riskAggregates);
  }

  public async findTop(limit = DEFAULT_LIMIT): Promise<RiskAggregate[]> {
    return this.find({}, { sort: { riskScore: -1 }, limit });
  }

  public async averageRiskScore(): Promise<number> {
    const [result] = await this.collection
      .aggregate<{ avgRisk: number }>([{ $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }])
      .toArray();
    return result?.avgRisk ?? 0;
  }
}
