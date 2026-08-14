import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getLoans, getLoanById, createLoan, approveLoan, rejectLoan, getLoanPayments,
} from "../controllers/loan.controller";

export const loanRouter = Router();
loanRouter.use(authenticate);

loanRouter.get("/", getLoans);
loanRouter.get("/:id", getLoanById);
loanRouter.post("/", createLoan);
loanRouter.put("/:id/approve", approveLoan);
loanRouter.put("/:id/reject", rejectLoan);
loanRouter.get("/:id/payments", getLoanPayments);
