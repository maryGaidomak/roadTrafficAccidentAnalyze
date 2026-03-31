import express from 'express';
import { createDashboardRouter } from './api/routes/dashboardRoutes';
import { errorHandler } from './api/errorHandler';
import { DashboardController } from './api/controllers/dashboardController';
import { DashboardService } from './services/dashboardService';
import { Repositories } from './services/repositoryFactory';

export const createApp = (repositories: Repositories) => {
  const app = express();

  app.use(express.json());

  const dashboardService = new DashboardService(repositories);
  const dashboardController = new DashboardController(dashboardService);

  app.use(createDashboardRouter(dashboardController));
  app.use(errorHandler);

  return app;
};
