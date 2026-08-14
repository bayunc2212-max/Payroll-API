import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getRekapGaji, exportRekapGajiExcel,
  exportBpjsExcel, exportPph21Excel,
  exportOvertimeExcel, getLoanReport, exportLoanExcel,
} from "../controllers/report.controller";

export const reportRouter = Router();
reportRouter.use(authenticate);

reportRouter.get("/rekap-gaji/:periodId", getRekapGaji);
reportRouter.get("/rekap-gaji/:periodId/excel", exportRekapGajiExcel);
reportRouter.get("/bpjs/:periodId/excel", exportBpjsExcel);
reportRouter.get("/pph21/:periodId/excel", exportPph21Excel);
reportRouter.get("/overtime/:periodId/excel", exportOvertimeExcel);
reportRouter.get("/loans", getLoanReport);
reportRouter.get("/loans/excel", exportLoanExcel);
