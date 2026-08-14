import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getAttendanceByPeriod, upsertAttendance, bulkUpsertAttendance } from "../controllers/attendance.controller";

export const attendanceRouter = Router();
attendanceRouter.use(authenticate);

attendanceRouter.get("/", getAttendanceByPeriod);
attendanceRouter.post("/", upsertAttendance);
attendanceRouter.post("/bulk", bulkUpsertAttendance);
