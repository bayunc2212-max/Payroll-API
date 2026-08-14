import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getPayrollPeriods, getPeriodById, createPeriod,
  processPeriod, finalizePeriod,
  getPeriodPayslips, updatePayslipBonus, previewCalculation,
} from "../controllers/payroll.controller";

export const payrollRouter = Router();
payrollRouter.use(authenticate);

payrollRouter.get("/periods", getPayrollPeriods);
payrollRouter.get("/periods/:id", getPeriodById);
payrollRouter.post("/periods", createPeriod);
payrollRouter.post("/periods/:id/process", processPeriod);
payrollRouter.post("/periods/:id/finalize", finalizePeriod);
payrollRouter.get("/periods/:id/payslips", getPeriodPayslips);
payrollRouter.put("/periods/:id/payslips/:payslipId/adjust", updatePayslipBonus);
payrollRouter.post("/calculate-preview", previewCalculation);
