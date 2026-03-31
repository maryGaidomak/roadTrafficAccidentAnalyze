import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';

export const createDashboardRouter = (controller: DashboardController): Router => {
  const router = Router();

  router.get('/health', controller.health);
  router.get('/api/incidents/recent', controller.recentIncidents);
  router.get('/api/telemetry/recent', controller.recentTelemetry);
  router.get('/api/risk/top', controller.topRisk);
  router.get('/api/stats/summary', controller.statsSummary);
  router.get('/api/regions', controller.regions);
  router.get('/api/segments/:id', controller.segmentById);
  router.get('/api/stats/historical', controller.historicalStats);

  return router;
};
