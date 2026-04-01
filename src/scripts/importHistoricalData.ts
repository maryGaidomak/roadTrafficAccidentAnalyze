import { AnyBulkWriteOperation } from 'mongodb';
import { COLLECTIONS } from '../config/constants';
import { HistoricalAccidentStat } from '../domain/models';
import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { normalizeDate, pickNumber, pickString, readInputRecords, resolveInputPath, RawRecord } from './importFileUtils';
import { logger } from '../utils/logger';

interface HistoricalPartial {
  region: string;
  date: string;
  accidentsCount: number;
  injuriesCount: number;
  fatalitiesCount: number;
  event_time: Date;
}

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
};

const mapHistoricalRecord = (record: RawRecord): HistoricalPartial | null => {
  const regionFromArray = asStringArray(record.REGIONS)[0] ?? null;
  const region = pickString(record, ['region', 'regionName', 'region_name', 'subject', 'oblast', 'PLACE', 'NP']) ?? regionFromArray;

  const dateRaw = record.date ?? record.event_date ?? record.day ?? record.dt ?? record.DATE_TIME;
  const date = normalizeDate(dateRaw);

  const accidentsCount =
    pickNumber(record, ['accidentsCount', 'accidents_count', 'accidents', 'crashes', 'totalAccidents']) ??
    (date && region ? 1 : null);

  let injuriesCount =
    pickNumber(record, ['injuriesCount', 'injuries_count', 'injured', 'injuries', 'totalInjuries', 'SUFFER_AMOUNT']) ?? null;

  let fatalitiesCount = pickNumber(record, ['fatalitiesCount', 'fatalities_count', 'fatalities', 'deaths', 'killed', 'LOST_AMOUNT']);

  if (injuriesCount === null) {
    const casualties = pickNumber(record, ['casualties', 'victims']);
    injuriesCount = casualties;
  }

  if (fatalitiesCount === null) {
    fatalitiesCount = 0;
  }

  if (!region || !date || accidentsCount === null || injuriesCount === null) {
    return null;
  }

  const parsedEventTime = record.event_time ?? record.timestamp ?? record.DATE_TIME;
  const eventTime = parsedEventTime ? new Date(String(parsedEventTime)) : new Date(`${date}T00:00:00.000Z`);

  return {
    region,
    date,
    accidentsCount: Math.max(0, Math.round(accidentsCount)),
    injuriesCount: Math.max(0, Math.round(injuriesCount)),
    fatalitiesCount: Math.max(0, Math.round(fatalitiesCount)),
    event_time: Number.isNaN(eventTime.getTime()) ? new Date(`${date}T00:00:00.000Z`) : eventTime
  };
};

const aggregateRecords = (records: HistoricalPartial[]): HistoricalAccidentStat[] => {
  const aggregated = new Map<string, HistoricalAccidentStat>();

  records.forEach((record) => {
    const key = `${record.region}::${record.date}`;
    const existing = aggregated.get(key);

    if (!existing) {
      aggregated.set(key, {
        region: record.region,
        date: record.date,
        accidentsCount: record.accidentsCount,
        injuriesCount: record.injuriesCount,
        fatalitiesCount: record.fatalitiesCount,
        event_time: record.event_time,
        updatedAt: new Date()
      });
      return;
    }

    existing.accidentsCount += record.accidentsCount;
    existing.injuriesCount += record.injuriesCount;
    existing.fatalitiesCount += record.fatalitiesCount;
    if (record.event_time < (existing.event_time ?? record.event_time)) {
      existing.event_time = record.event_time;
    }
    existing.updatedAt = new Date();
  });

  return Array.from(aggregated.values());
};

const run = async (): Promise<void> => {
  const filePath = resolveInputPath();
  logger.info({ filePath }, 'Starting historical stats import');

  const rawRecords = await readInputRecords(filePath);
  if (rawRecords.length === 0) {
    logger.warn({ filePath }, 'No records found in input file');
    return;
  }

  let skipped = 0;
  const mappedRecords: HistoricalPartial[] = [];

  rawRecords.forEach((record, index) => {
    const mapped = mapHistoricalRecord(record);
    if (!mapped) {
      skipped += 1;
      logger.warn({ index }, 'Skipping invalid historical record (missing required fields)');
      return;
    }
    mappedRecords.push(mapped);
  });

  const normalizedRecords = aggregateRecords(mappedRecords);

  if (normalizedRecords.length === 0) {
    logger.warn({ skipped }, 'No valid historical records to import');
    return;
  }

  const db = await connectMongo();
  const collection = db.collection<HistoricalAccidentStat>(COLLECTIONS.historicalAccidentStats);

  const operations: AnyBulkWriteOperation<HistoricalAccidentStat>[] = normalizedRecords.map((doc) => ({
    updateOne: {
      filter: { region: doc.region, date: doc.date },
      update: { $set: doc },
      upsert: true
    }
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });
  logger.info(
    {
      sourceRecords: rawRecords.length,
      mappedRecords: mappedRecords.length,
      importedAggregates: normalizedRecords.length,
      skipped,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount
    },
    'Historical stats import completed'
  );

  await closeMongo();
};

run().catch(async (error: Error) => {
  logger.error({ err: error }, 'Historical stats import failed');
  await closeMongo();
  process.exit(1);
});
