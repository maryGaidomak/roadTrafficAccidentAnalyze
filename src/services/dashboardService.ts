import { StatsSummary } from '../domain/models';
import { Repositories } from './repositoryFactory';

export class DashboardService {
  constructor(private readonly repositories: Repositories) {}

  public getRecentIncidents(limit?: number) {
    return this.repositories.incidentRepository.findRecent(limit);
  }

  public getRecentTelemetry(limit?: number) {
    return this.repositories.telemetryRepository.findRecent(limit);
  }

  public getTopRisk(limit?: number) {
    return this.repositories.riskAggregateRepository.findTop(limit);
  }

  public getRegions() {
    return this.repositories.roadSegmentRepository.findRegions();
  }

  public getSegmentById(segmentId: string) {
    return this.repositories.roadSegmentRepository.findBySegmentId(segmentId);
  }

  public getHistoricalStats(limit?: number) {
    return this.repositories.historicalAccidentStatRepository.findRecent(limit);
  }

  public async getStatsSummary(): Promise<StatsSummary> {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalIncidents24h, totalTelemetryEvents24h, avgRiskScore, regions] = await Promise.all([
      this.repositories.incidentRepository.countLast24h(since),
      this.repositories.telemetryRepository.countLast24h(since),
      this.repositories.riskAggregateRepository.averageRiskScore(),
      this.repositories.roadSegmentRepository.findRegions()
    ]);

    return {
      totalIncidents24h,
      totalTelemetryEvents24h,
      avgRiskScore,
      regionsCount: regions.length
    };
  }
}
