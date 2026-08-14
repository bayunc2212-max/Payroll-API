import { Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import { attendance, employees, departments } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess } from "../utils/response.util";

export const getAttendanceByPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const year = parseInt(String(req.query.year || new Date().getFullYear()));
    const month = parseInt(String(req.query.month || new Date().getMonth() + 1));
    const departmentId = req.query.departmentId as string | undefined;

    // Get all active employees
    const empConditions = [eq(employees.companyId, companyId), eq(employees.status, "active")];
    if (departmentId) empConditions.push(eq(employees.departmentId, departmentId));

    const allEmployees = await db.select({
      id: employees.id,
      name: employees.name,
      employeeNumber: employees.employeeNumber,
      departmentName: departments.name,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(and(...empConditions))
    .orderBy(employees.name);

    // Get attendance records for this period
    const attendanceRecords = await db.select().from(attendance)
      .where(and(eq(attendance.periodYear, year), eq(attendance.periodMonth, month)));

    const attendanceMap = new Map(attendanceRecords.map(a => [a.employeeId, a]));

    // Merge employees with their attendance
    const data = allEmployees.map(emp => ({
      ...emp,
      attendance: attendanceMap.get(emp.id) || {
        employeeId: emp.id,
        periodYear: year,
        periodMonth: month,
        workingDays: 0,
        presentDays: 0,
        sickDays: 0,
        permissionDays: 0,
        absentDays: 0,
        overtimeHours: "0",
      },
    }));

    return sendSuccess(res, { year, month, employees: data });
  } catch (err) { next(err); }
};

export const upsertAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      employeeId, periodYear, periodMonth,
      workingDays, presentDays, sickDays, permissionDays, absentDays, overtimeHours, notes,
    } = req.body;

    if (!employeeId || !periodYear || !periodMonth) {
      throw new AppError("Data absensi tidak lengkap.", 400);
    }

    // Check if exists
    const [existing] = await db.select().from(attendance)
      .where(and(
        eq(attendance.employeeId, employeeId),
        eq(attendance.periodYear, Number(periodYear)),
        eq(attendance.periodMonth, Number(periodMonth))
      )).limit(1);

    let result;
    if (existing) {
      await db.update(attendance)
        .set({
          workingDays: Number(workingDays) || 0,
          presentDays: Number(presentDays) || 0,
          sickDays: Number(sickDays) || 0,
          permissionDays: Number(permissionDays) || 0,
          absentDays: Number(absentDays) || 0,
          overtimeHours: String(overtimeHours || 0),
          notes,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existing.id));
      [result] = await db.select().from(attendance).where(eq(attendance.id, existing.id)).limit(1);
    } else {
      const recordId = randomUUID();
      await db.insert(attendance).values({
        id: recordId,
        employeeId,
        periodYear: Number(periodYear),
        periodMonth: Number(periodMonth),
        workingDays: Number(workingDays) || 0,
        presentDays: Number(presentDays) || 0,
        sickDays: Number(sickDays) || 0,
        permissionDays: Number(permissionDays) || 0,
        absentDays: Number(absentDays) || 0,
        overtimeHours: String(overtimeHours || 0),
        notes,
      });
      [result] = await db.select().from(attendance).where(eq(attendance.id, recordId)).limit(1);
    }

    return sendSuccess(res, result, "Data absensi berhasil disimpan");
  } catch (err) { next(err); }
};

export const bulkUpsertAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { records } = req.body; // array of attendance records
    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError("Data absensi tidak boleh kosong.", 400);
    }

    const results = [];
    for (const rec of records) {
      const { employeeId, periodYear, periodMonth,
        workingDays, presentDays, sickDays, permissionDays, absentDays, overtimeHours, notes } = rec;

      const [existing] = await db.select().from(attendance)
        .where(and(
          eq(attendance.employeeId, employeeId),
          eq(attendance.periodYear, Number(periodYear)),
          eq(attendance.periodMonth, Number(periodMonth))
        )).limit(1);

      if (existing) {
        await db.update(attendance)
          .set({
            workingDays: Number(workingDays) || 0,
            presentDays: Number(presentDays) || 0,
            sickDays: Number(sickDays) || 0,
            permissionDays: Number(permissionDays) || 0,
            absentDays: Number(absentDays) || 0,
            overtimeHours: String(overtimeHours || 0),
            notes,
            updatedAt: new Date(),
          })
          .where(eq(attendance.id, existing.id));
        const [updated] = await db.select().from(attendance).where(eq(attendance.id, existing.id)).limit(1);
        results.push(updated);
      } else {
        const recordId = randomUUID();
        await db.insert(attendance).values({
          id: recordId,
          employeeId, periodYear: Number(periodYear), periodMonth: Number(periodMonth),
          workingDays: Number(workingDays) || 0,
          presentDays: Number(presentDays) || 0,
          sickDays: Number(sickDays) || 0,
          permissionDays: Number(permissionDays) || 0,
          absentDays: Number(absentDays) || 0,
          overtimeHours: String(overtimeHours || 0),
          notes,
        });
        const [created] = await db.select().from(attendance).where(eq(attendance.id, recordId)).limit(1);
        results.push(created);
      }
    }

    return sendSuccess(res, results, `${results.length} data absensi berhasil disimpan`);
  } catch (err) { next(err); }
};
