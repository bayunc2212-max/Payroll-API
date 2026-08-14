import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";

import { authRouter } from "./routes/auth.routes";
import { departmentRouter } from "./routes/department.routes";
import { positionRouter } from "./routes/position.routes";
import { employeeRouter } from "./routes/employee.routes";
import { loanRouter } from "./routes/loan.routes";
import { attendanceRouter } from "./routes/attendance.routes";
import { settingsRouter } from "./routes/settings.routes";
import { payrollRouter } from "./routes/payroll.routes";
import { payslipRouter } from "./routes/payslip.routes";
import { reportRouter } from "./routes/report.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFound } from "./middleware/notFound.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Static files (uploads)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/positions", positionRouter);
app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/loans", loanRouter);
app.use("/api/v1/attendance", attendanceRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/payroll", payrollRouter);
app.use("/api/v1/payslips", payslipRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/dashboard", dashboardRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
