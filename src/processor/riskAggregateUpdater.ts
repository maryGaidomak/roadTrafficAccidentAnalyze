import { Collection } from 'mongodb';
import { IncidentEvent, RiskAggregate, TelemetryEvent } from '../domain/models';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const recalculateRiskAggregate = async (
  segmentId: string,
  telemetryCollection: Collection<TelemetryEvent>,
  incidentCollection: Collection<IncidentEvent>,
  riskCollection: Collection<RiskAggregate>
): Promise<void> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentTelemetry = await telemetryCollection
    .find({ segmentId, timestamp: { $gte: oneHourAgo } }, { sort: { timestamp: -1 }, limit: 50 })
    .toArray();

  if (recentTelemetry.length === 0) {
    return;
  }

  const avgSpeedLastHour =
    recentTelemetry.reduce((acc: number, event: TelemetryEvent) => acc + event.avgSpeedKmh, 0) / recentTelemetry.length;

  const incidentCountLast24h = await incidentCollection.countDocuments({
    segmentId,
    timestamp: { $gte: oneDayAgo }
  });

  const avgOccupancy =
    recentTelemetry.reduce((acc: number, event: TelemetryEvent) => acc + event.occupancy, 0) / recentTelemetry.length;
  const latestRegion = recentTelemetry[0]?.region ?? 'unknown';

  const speedRisk = clamp((90 - avgSpeedLastHour) / 90, 0, 1);
  const occupancyRisk = clamp(avgOccupancy, 0, 1);
  const incidentsRisk = clamp(incidentCountLast24h / 10, 0, 1);
  const riskScore = Number(clamp(0.45 * occupancyRisk + 0.35 * speedRisk + 0.2 * incidentsRisk, 0, 1).toFixed(2));

  await riskCollection.updateOne(
    { segmentId },
    {
      $set: {
        segmentId,
        region: latestRegion,
        riskScore,
        incidentCountLast24h,
        avgSpeedLastHour: Number(avgSpeedLastHour.toFixed(2)),
        windowEnd: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );
};
