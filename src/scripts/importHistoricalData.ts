import { AnyBulkWriteOperation } from 'mongodb';
import { COLLECTIONS } from '../config/constants';
import { HistoricalAccidentStat } from '../domain/models';
import { closeMongo, connectMongo } from '../infrastructure/mongo/client';
import { normalizeDate, pickNumber, pickString, readInputRecords, resolveInputPath, RawRecord } from './importFileUtils';
import { logger } from '../utils/logger';

const mapHistoricalRecord = (record: RawRecord): HistoricalAccidentStat | null => {
  const region = pickString(record, ['region', 'regionName', 'region_name', 'subject', 'oblast']);
  const dateRaw = record.date ?? record.event_date ?? record.day ?? record.dt;
  const date = normalizeDate(dateRaw);

  const accidentsCount = pickNumber(record, ['accidentsCount', 'accidents_count', 'accidents', 'crashes', 'totalAccidents']);

  let injuriesCount = pickNumber(record, ['injuriesCount', 'injuries_count', 'injured', 'injuries', 'totalInjuries']);
  let fatalitiesCount = pickNumber(record, ['fatalitiesCount', 'fatalities_count', 'fatalities', 'deaths', 'killed']);

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

  const parsedEventTime = record.event_time ?? record.timestamp;
  const eventTime = parsedEventTime ? new Date(String(parsedEventTime)) : new Date(`${date}T00:00:00.000Z`);

  return {
    region,
    date,
    accidentsCount: Math.max(0, Math.round(accidentsCount)),
    injuriesCount: Math.max(0, Math.round(injuriesCount)),
    fatalitiesCount: Math.max(0, Math.round(fatalitiesCount)),
    event_time: Number.isNaN(eventTime.getTime()) ? new Date(`${date}T00:00:00.000Z`) : eventTime,
    updatedAt: new Date()
  };
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
  const normalizedRecords: HistoricalAccidentStat[] = [];

  rawRecords.forEach((record, index) => {
    const mapped = mapHistoricalRecord(record);
    if (!mapped) {
      skipped += 1;
      logger.warn({ index, record }, 'Skipping invalid historical record (missing required fields)');
      return;
    }
    normalizedRecords.push(mapped);
  });

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
      imported: normalizedRecords.length,
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
