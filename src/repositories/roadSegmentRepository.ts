import { Db } from 'mongodb';
import { COLLECTIONS } from '../config/constants';
import { RoadSegment } from '../domain/models';
import { BaseRepository } from './baseRepository';

export class RoadSegmentRepository extends BaseRepository<RoadSegment> {
  constructor(db: Db) {
    super(db, COLLECTIONS.roadSegments);
  }

  public async findBySegmentId(segmentId: string): Promise<RoadSegment | null> {
    return this.findOne({ segmentId });
  }

  public async findRegions(): Promise<string[]> {
    return this.collection.distinct('region');
  }
}
