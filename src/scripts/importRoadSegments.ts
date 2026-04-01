import { AnyBulkWriteOperation } from 'mongodb';
import { COLLECTIONS } from '../config/constants';
import { GeoPoint, RoadSegment } from '../domain/models';
import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { normalizeDate, pickNumber, pickString, readInputRecords, resolveInputPath, RawRecord } from './importFileUtils';
import { logger } from '../utils/logger';

const isGeoPoint = (value: unknown): value is GeoPoint => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const geo = value as { lat?: unknown; lon?: unknown; lng?: unknown };
  const lat = typeof geo.lat === 'number' ? geo.lat : null;
  const lonCandidate = typeof geo.lon === 'number' ? geo.lon : typeof geo.lng === 'number' ? geo.lng : null;

  return lat !== null && lonCandidate !== null;
};

const parsePoint = (value: unknown): GeoPoint | null => {
  if (isGeoPoint(value)) {
    const geo = value as { lat: number; lon?: number; lng?: number };
    return { lat: geo.lat, lon: geo.lon ?? (geo.lng as number) };
  }

  if (Array.isArray(value) && value.length >= 2) {
    const lon = Number(value[0]);
    const lat = Number(value[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return { lat, lon };
    }
  }

  return null;
};

const pickPointFromRecord = (record: RawRecord, key: string, latKey: string, lonKey: string): GeoPoint | null => {
  const direct = parsePoint(record[key]);
  if (direct) {
    return direct;
  }

  const lat = pickNumber(record, [latKey]);
  const lon = pickNumber(record, [lonKey]);

  if (lat === null || lon === null) {
    return null;
  }

  return { lat, lon };
};

const mapRoadSegment = (record: RawRecord): RoadSegment | null => {
  const segmentId = pickString(record, ['segmentId', 'segment_id', 'id']);
  const region = pickString(record, ['region', 'regionName', 'region_name']);
  const name = pickString(record, ['name', 'title', 'roadName']);
  const speedLimit = pickNumber(record, ['speedLimit', 'speed_limit', 'max_speed']);
  const lanes = pickNumber(record, ['lanes', 'lane_count']);

  const startPoint = pickPointFromRecord(record, 'startPoint', 'startLat', 'startLon');
  const endPoint = pickPointFromRecord(record, 'endPoint', 'endLat', 'endLon');

  if (!startPoint || !endPoint) {
    const coordinates = record.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const first = parsePoint(coordinates[0]);
      const last = parsePoint(coordinates[coordinates.length - 1]);
      if (first && last) {
        if (!startPoint) {
          (record as RawRecord).startPoint = first;
        }
        if (!endPoint) {
          (record as RawRecord).endPoint = last;
        }
      }
    }
  }

  const normalizedStart = pickPointFromRecord(record, 'startPoint', 'startLat', 'startLon');
  const normalizedEnd = pickPointFromRecord(record, 'endPoint', 'endLat', 'endLon');

  if (!segmentId || !region || !name || speedLimit === null || lanes === null || !normalizedStart || !normalizedEnd) {
    return null;
  }

  if (speedLimit <= 0 || lanes <= 0) {
    return null;
  }

  const now = new Date();
  const createdAtCandidate = normalizeDate(record.createdAt) ?? normalizeDate(record.created_at);

  return {
    segmentId,
    region,
    name,
    startPoint: normalizedStart,
    endPoint: normalizedEnd,
    speedLimit: Math.round(speedLimit),
    lanes: Math.round(lanes),
    createdAt: createdAtCandidate ? new Date(`${createdAtCandidate}T00:00:00.000Z`) : now,
    updatedAt: now
  };
};

const run = async (): Promise<void> => {
  const filePath = resolveInputPath();
  logger.info({ filePath }, 'Starting road segments import');

  const rawRecords = await readInputRecords(filePath);

  let skipped = 0;
  const normalizedRecords: RoadSegment[] = [];

  rawRecords.forEach((record, index) => {
    const mapped = mapRoadSegment(record);
    if (!mapped) {
      skipped += 1;
      logger.warn({ index, record }, 'Skipping invalid road segment record (missing required fields)');
      return;
    }
    normalizedRecords.push(mapped);
  });

  if (normalizedRecords.length === 0) {
    logger.warn({ skipped }, 'No valid road segment records to import');
    return;
  }

  const db = await connectMongo();
  const collection = db.collection<RoadSegment>(COLLECTIONS.roadSegments);

  const operations: AnyBulkWriteOperation<RoadSegment>[] = normalizedRecords.map((doc) => ({
    updateOne: {
      filter: { segmentId: doc.segmentId },
      update: {
        $set: {
          region: doc.region,
          name: doc.name,
          startPoint: doc.startPoint,
          endPoint: doc.endPoint,
          speedLimit: doc.speedLimit,
          lanes: doc.lanes,
          updatedAt: doc.updatedAt
        },
        $setOnInsert: { createdAt: doc.createdAt }
      },
      upsert: true
    }
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  logger.info(
    {
      imported: normalizedRecords.length,
      skipped,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount
    },
    'Road segments import completed'
  );

  await closeMongo();
};

run().catch(async (error: Error) => {
  logger.error({ err: error }, 'Road segments import failed');
  await closeMongo();
  process.exit(1);
});
