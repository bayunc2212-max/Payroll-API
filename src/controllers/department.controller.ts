import { Response, NextFunction } from "express";
import { eq, and, ilike, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import { departments, employees } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendPaginated, parsePagination } from "../utils/response.util";

export const getDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || "");

    const conditions = [eq(departments.companyId, companyId)];
    if (search) conditions.push(ilike(departments.name, `%${search}%`));

    const [data, [{ total }]] = await Promise.all([
      db.select().from(departments).where(and(...conditions)).limit(limit).offset(offset),
      db.select({ total: count() }).from(departments).where(and(...conditions)),
    ]);

    return sendPaginated(res, data, Number(total), page, limit);
  } catch (err) { next(err); }
};

export const getDepartmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [dept] = await db.select().from(departments)
      .where(and(eq(departments.id, req.params.id), eq(departments.companyId, req.user!.companyId!)))
      .limit(1);
    if (!dept) throw new AppError("Departemen tidak ditemukan.", 404);
    return sendSuccess(res, dept);
  } catch (err) { next(err); }
};

export const createDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) throw new AppError("Nama departemen wajib diisi.", 400);

    const deptId = randomUUID();
    await db.insert(departments)
      .values({ id: deptId, name, description, companyId: req.user!.companyId! });
    const [dept] = await db.select().from(departments).where(eq(departments.id, deptId)).limit(1);

    return sendSuccess(res, dept, "Departemen berhasil dibuat", 201);
  } catch (err) { next(err); }
};

export const updateDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const [existing] = await db.select().from(departments)
      .where(and(eq(departments.id, req.params.id), eq(departments.companyId, req.user!.companyId!)))
      .limit(1);
    if (!existing) throw new AppError("Departemen tidak ditemukan.", 404);

    await db.update(departments)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(departments.id, req.params.id));
    const [updated] = await db.select().from(departments).where(eq(departments.id, req.params.id)).limit(1);

    return sendSuccess(res, updated, "Departemen berhasil diperbarui");
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [existing] = await db.select().from(departments)
      .where(and(eq(departments.id, req.params.id), eq(departments.companyId, req.user!.companyId!)))
      .limit(1);
    if (!existing) throw new AppError("Departemen tidak ditemukan.", 404);

    // Check if any employee uses this department
    const [{ total }] = await db.select({ total: count() }).from(employees)
      .where(eq(employees.departmentId, req.params.id));
    if (Number(total) > 0) {
      throw new AppError(`Tidak dapat menghapus departemen yang masih memiliki ${total} karyawan.`, 400);
    }

    await db.delete(departments).where(eq(departments.id, req.params.id));
    return sendSuccess(res, null, "Departemen berhasil dihapus");
  } catch (err) { next(err); }
};
