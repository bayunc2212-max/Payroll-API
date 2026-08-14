import { Response, NextFunction } from "express";
import { eq, and, ilike, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import { positions, employees, departments } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendPaginated, parsePagination } from "../utils/response.util";

export const getPositions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || "");
    const departmentId = req.query.departmentId as string | undefined;

    const conditions = [eq(positions.companyId, companyId)];
    if (search) conditions.push(ilike(positions.name, `%${search}%`));
    if (departmentId) conditions.push(eq(positions.departmentId, departmentId));

    const [data, [{ total }]] = await Promise.all([
      db.select({
        id: positions.id,
        name: positions.name,
        description: positions.description,
        departmentId: positions.departmentId,
        departmentName: departments.name,
        createdAt: positions.createdAt,
      })
      .from(positions)
      .leftJoin(departments, eq(positions.departmentId, departments.id))
      .where(and(...conditions))
      .limit(limit).offset(offset),
      db.select({ total: count() }).from(positions).where(and(...conditions)),
    ]);

    return sendPaginated(res, data, Number(total), page, limit);
  } catch (err) { next(err); }
};

export const getPositionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [pos] = await db.select().from(positions)
      .where(and(eq(positions.id, req.params.id), eq(positions.companyId, req.user!.companyId!)))
      .limit(1);
    if (!pos) throw new AppError("Jabatan tidak ditemukan.", 404);
    return sendSuccess(res, pos);
  } catch (err) { next(err); }
};

export const createPosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, departmentId } = req.body;
    if (!name) throw new AppError("Nama jabatan wajib diisi.", 400);

    const posId = randomUUID();
    await db.insert(positions)
      .values({ id: posId, name, description, departmentId: departmentId || null, companyId: req.user!.companyId! });
    const [pos] = await db.select().from(positions).where(eq(positions.id, posId)).limit(1);

    return sendSuccess(res, pos, "Jabatan berhasil dibuat", 201);
  } catch (err) { next(err); }
};

export const updatePosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [existing] = await db.select().from(positions)
      .where(and(eq(positions.id, req.params.id), eq(positions.companyId, req.user!.companyId!)))
      .limit(1);
    if (!existing) throw new AppError("Jabatan tidak ditemukan.", 404);

    const { name, description, departmentId } = req.body;
    await db.update(positions)
      .set({ name, description, departmentId: departmentId || null, updatedAt: new Date() })
      .where(eq(positions.id, req.params.id));
    const [updated] = await db.select().from(positions).where(eq(positions.id, req.params.id)).limit(1);

    return sendSuccess(res, updated, "Jabatan berhasil diperbarui");
  } catch (err) { next(err); }
};

export const deletePosition = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [existing] = await db.select().from(positions)
      .where(and(eq(positions.id, req.params.id), eq(positions.companyId, req.user!.companyId!)))
      .limit(1);
    if (!existing) throw new AppError("Jabatan tidak ditemukan.", 404);

    const [{ total }] = await db.select({ total: count() }).from(employees)
      .where(eq(employees.positionId, req.params.id));
    if (Number(total) > 0) {
      throw new AppError(`Tidak dapat menghapus jabatan yang masih digunakan ${total} karyawan.`, 400);
    }

    await db.delete(positions).where(eq(positions.id, req.params.id));
    return sendSuccess(res, null, "Jabatan berhasil dihapus");
  } catch (err) { next(err); }
};
