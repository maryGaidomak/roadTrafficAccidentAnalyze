import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../../services/dashboardService';
import { ApiError } from '../../utils/errors';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public health = async (_req: Request, res: Response): Promise<void> => {
    res.json({ status: 'ok', service: 'road-traffic-backend', timestamp: new Date().toISOString() });
  };

  public recentIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await this.dashboardService.getRecentIncidents(limit);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public recentTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await this.dashboardService.getRecentTelemetry(limit);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  public topRisk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
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
      const segment = await this.dashboardService.getSegmentById(req.params.id);
      if (!segment) {
        throw new ApiError(404, 'Segment not found');
      }
      res.json(segment);
    } catch (error) {
      next(error);
    }
  };

  public historicalStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await this.dashboardService.getHistoricalStats(limit);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };
}
