import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getPayslipById, downloadPayslipPdf,
  sendPayslipEmailEndpoint, sendAllPayslipEmails,
} from "../controllers/payslip.controller";

export const payslipRouter = Router();
payslipRouter.use(authenticate);

payslipRouter.get("/:id", getPayslipById);
payslipRouter.get("/:id/pdf", downloadPayslipPdf);
payslipRouter.post("/:id/send-email", sendPayslipEmailEndpoint);
payslipRouter.post("/period/:periodId/send-all", sendAllPayslipEmails);
