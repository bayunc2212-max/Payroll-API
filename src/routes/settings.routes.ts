import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getBpjsConfig, updateBpjsConfig,
  getTaxConfig, updateTaxConfig,
  getCompanyProfile, updateCompanyProfile,
} from "../controllers/settings.controller";

export const settingsRouter = Router();
settingsRouter.use(authenticate);

settingsRouter.get("/bpjs", getBpjsConfig);
settingsRouter.put("/bpjs", updateBpjsConfig);
settingsRouter.get("/tax", getTaxConfig);
settingsRouter.put("/tax", updateTaxConfig);
settingsRouter.get("/company", getCompanyProfile);
settingsRouter.put("/company", updateCompanyProfile);
