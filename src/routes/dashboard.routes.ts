import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getDashboardSummary } from "../controllers/dashboard.controller";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/summary", getDashboardSummary);
