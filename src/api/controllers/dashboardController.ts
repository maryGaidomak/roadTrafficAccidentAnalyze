import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../../services/dashboardService';
import { ApiError } from '../../utils/errors';
import { parseDateParam, parseLimit, parseOptionalString } from '../../utils/validation';
import { isMongoConnected } from '../../infrastructure/mongo/client';
import { kafkaProducer } from '../../infrastructure/kafka/producer';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public health = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      status: isMongoConnected() && kafkaProducer.isConnected() ? 'ok' : 'degraded',
      uptime: Number(process.uptime().toFixed(2)),
      mongo: isMongoConnected() ? 'connected' : 'disconnected',
      kafka: kafkaProducer.isConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  };

  public recentIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseLimit(req.query.limit, 200, 50);
      const data = await this.dashboardService.getRecentIncidents(limit);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public recentTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseLimit(req.query.limit, 500, 100);
      const segmentId = parseOptionalString(req.query.segmentId);
      const data = await this.dashboardService.getRecentTelemetry(limit, segmentId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public topRisk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseLimit(req.query.limit, 100, 10);
      const data = await this.dashboardService.getTopRisk(limit);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public statsSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getStatsSummary();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public regions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getRegions();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public segmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const segmentId = req.params.id;
      if (!segmentId) {
        throw new ApiError(400, 'Segment id is required', 'VALIDATION_ERROR');
      }
      const segment = await this.dashboardService.getSegmentById(segmentId);
      if (!segment) {
        throw new ApiError(404, 'Segment not found', 'NOT_FOUND');
      }
      res.json(segment);
    } catch (error) {
      next(error);
    }
  };

  public historicalStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const region = parseOptionalString(req.query.region);
      const from = parseDateParam(req.query.from, 'from');
      const to = parseDateParam(req.query.to, 'to');

      if (from && to && from > to) {
        throw new ApiError(400, 'Invalid query parameter: from', 'VALIDATION_ERROR');
      }

      const data = await this.dashboardService.getHistoricalStats(region, from, to);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
