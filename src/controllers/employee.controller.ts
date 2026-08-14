import { Response, NextFunction } from "express";
import { eq, and, ilike, or, count, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import {
  employees, departments, positions,
  salaryHistory, positionHistory, employeeDocuments,
} from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendPaginated, parsePagination } from "../utils/response.util";
import path from "path";
import fs from "fs";

export const getEmployees = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = String(req.query.search || "");
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;

    const conditions = [eq(employees.companyId, companyId)];
    if (search) {
      conditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.employeeNumber, `%${search}%`),
          ilike(employees.nik, `%${search}%`)
        )!
      );
    }
    if (status) conditions.push(eq(employees.status, status as "active" | "inactive" | "resigned" | "terminated"));
    if (departmentId) conditions.push(eq(employees.departmentId, departmentId));

    const [data, [{ total }]] = await Promise.all([
      db.select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        name: employees.name,
        nik: employees.nik,
        photo: employees.photo,
        gender: employees.gender,
        email: employees.email,
        phone: employees.phone,
        joinDate: employees.joinDate,
        status: employees.status,
        basicSalary: employees.basicSalary,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        taxStatus: employees.taxStatus,
        departmentId: employees.departmentId,
        positionId: employees.positionId,
        departmentName: departments.name,
        positionName: positions.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(and(...conditions))
      .orderBy(employees.name)
      .limit(limit).offset(offset),
      db.select({ total: count() }).from(employees).where(and(...conditions)),
    ]);

    return sendPaginated(res, data, Number(total), page, limit);
  } catch (err) { next(err); }
};

export const getEmployeeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [emp] = await db.select({
      id: employees.id,
      companyId: employees.companyId,
      employeeNumber: employees.employeeNumber,
      nik: employees.nik,
      name: employees.name,
      gender: employees.gender,
      birthPlace: employees.birthPlace,
      birthDate: employees.birthDate,
      address: employees.address,
      phone: employees.phone,
      email: employees.email,
      photo: employees.photo,
      maritalStatus: employees.maritalStatus,
      dependents: employees.dependents,
      taxStatus: employees.taxStatus,
      npwp: employees.npwp,
      joinDate: employees.joinDate,
      resignDate: employees.resignDate,
      status: employees.status,
      basicSalary: employees.basicSalary,
      allowanceTransport: employees.allowanceTransport,
      allowanceMeal: employees.allowanceMeal,
      allowancePosition: employees.allowancePosition,
      allowanceOther: employees.allowanceOther,
      bpjsHealthNumber: employees.bpjsHealthNumber,
      bpjsEmploymentNumber: employees.bpjsEmploymentNumber,
      isBpjsHealth: employees.isBpjsHealth,
      isBpjsEmployment: employees.isBpjsEmployment,
      bankName: employees.bankName,
      bankAccountNumber: employees.bankAccountNumber,
      bankAccountName: employees.bankAccountName,
      departmentId: employees.departmentId,
      positionId: employees.positionId,
      departmentName: departments.name,
      positionName: positions.name,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(and(eq(employees.id, req.params.id), eq(employees.companyId, companyId)))
    .limit(1);

    if (!emp) throw new AppError("Karyawan tidak ditemukan.", 404);
    return sendSuccess(res, emp);
  } catch (err) { next(err); }
};

export const createEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const {
      nik, employeeNumber, name, gender, birthPlace, birthDate, address,
      phone, email, maritalStatus, dependents, taxStatus, npwp,
      joinDate, basicSalary, allowanceTransport, allowanceMeal,
      allowancePosition, allowanceOther, bpjsHealthNumber, bpjsEmploymentNumber,
      isBpjsHealth, isBpjsEmployment, bankName, bankAccountNumber, bankAccountName,
      departmentId, positionId,
    } = req.body;

    if (!nik || !employeeNumber || !name || !joinDate || !basicSalary) {
      throw new AppError("NIK, nomor karyawan, nama, tanggal masuk, dan gaji pokok wajib diisi.", 400);
    }

    const empId = randomUUID();
    await db.insert(employees).values({
      id: empId,
      companyId, nik, employeeNumber, name, gender, birthPlace, birthDate,
      address, phone, email, maritalStatus, dependents: Number(dependents) || 0,
      taxStatus, npwp, joinDate, basicSalary: String(basicSalary),
      allowanceTransport: String(allowanceTransport || 0),
      allowanceMeal: String(allowanceMeal || 0),
      allowancePosition: String(allowancePosition || 0),
      allowanceOther: String(allowanceOther || 0),
      bpjsHealthNumber, bpjsEmploymentNumber,
      isBpjsHealth: isBpjsHealth !== false,
      isBpjsEmployment: isBpjsEmployment !== false,
      bankName, bankAccountNumber, bankAccountName,
      departmentId: departmentId || null, positionId: positionId || null,
    });
    const [emp] = await db.select().from(employees).where(eq(employees.id, empId)).limit(1);

    // Record initial salary history
    await db.insert(salaryHistory).values({
      employeeId: emp.id,
      basicSalary: String(basicSalary),
      allowanceTransport: String(allowanceTransport || 0),
      allowanceMeal: String(allowanceMeal || 0),
      allowancePosition: String(allowancePosition || 0),
      allowanceOther: String(allowanceOther || 0),
      effectiveDate: joinDate,
      notes: "Gaji awal saat bergabung",
    });

    return sendSuccess(res, emp, "Karyawan berhasil dibuat", 201);
  } catch (err) { next(err); }
};

export const updateEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [existing] = await db.select().from(employees)
      .where(and(eq(employees.id, req.params.id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!existing) throw new AppError("Karyawan tidak ditemukan.", 404);

    const updateData = { ...req.body, updatedAt: new Date() };

    // Track salary change
    const salaryChanged =
      (updateData.basicSalary && String(updateData.basicSalary) !== String(existing.basicSalary)) ||
      (updateData.allowanceTransport !== undefined && String(updateData.allowanceTransport) !== String(existing.allowanceTransport));

    // Track position change
    const positionChanged =
      (updateData.departmentId && updateData.departmentId !== existing.departmentId) ||
      (updateData.positionId && updateData.positionId !== existing.positionId);

    await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, req.params.id));
    const [updated] = await db.select().from(employees).where(eq(employees.id, req.params.id)).limit(1);

    if (salaryChanged) {
      await db.insert(salaryHistory).values({
        employeeId: updated.id,
        basicSalary: updated.basicSalary,
        allowanceTransport: updated.allowanceTransport || "0",
        allowanceMeal: updated.allowanceMeal || "0",
        allowancePosition: updated.allowancePosition || "0",
        allowanceOther: updated.allowanceOther || "0",
        effectiveDate: new Date().toISOString().split("T")[0],
        notes: updateData.salaryNotes || "Perubahan gaji",
      });
    }

    if (positionChanged) {
      const [dept] = updated.departmentId
        ? await db.select().from(departments).where(eq(departments.id, updated.departmentId!)).limit(1)
        : [null];
      const [pos] = updated.positionId
        ? await db.select().from(positions).where(eq(positions.id, updated.positionId!)).limit(1)
        : [null];

      await db.insert(positionHistory).values({
        employeeId: updated.id,
        departmentId: updated.departmentId,
        positionId: updated.positionId,
        departmentName: dept?.name,
        positionName: pos?.name,
        effectiveDate: new Date().toISOString().split("T")[0],
        notes: updateData.positionNotes || "Perubahan jabatan",
      });
    }

    return sendSuccess(res, updated, "Data karyawan berhasil diperbarui");
  } catch (err) { next(err); }
};

export const deleteEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [existing] = await db.select().from(employees)
      .where(and(eq(employees.id, req.params.id), eq(employees.companyId, companyId)))
      .limit(1);
    if (!existing) throw new AppError("Karyawan tidak ditemukan.", 404);

    // Soft delete
    await db.update(employees)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(employees.id, req.params.id));

    return sendSuccess(res, null, "Karyawan berhasil dinonaktifkan");
  } catch (err) { next(err); }
};

// Documents
export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await db.select().from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, req.params.id))
      .orderBy(desc(employeeDocuments.createdAt));
    return sendSuccess(res, docs);
  } catch (err) { next(err); }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    if (!file) throw new AppError("File tidak ditemukan.", 400);

    const { type, name, expiryDate, notes } = req.body;
    const docId = randomUUID();
    await db.insert(employeeDocuments).values({
      id: docId,
      employeeId: req.params.id,
      type: type || "other",
      name: name || file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      expiryDate: expiryDate || null,
      notes,
    });
    const [doc] = await db.select().from(employeeDocuments).where(eq(employeeDocuments.id, docId)).limit(1);

    return sendSuccess(res, doc, "Dokumen berhasil diupload", 201);
  } catch (err) { next(err); }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [doc] = await db.select().from(employeeDocuments)
      .where(eq(employeeDocuments.id, req.params.docId))
      .limit(1);
    if (!doc) throw new AppError("Dokumen tidak ditemukan.", 404);

    // Delete file from disk
    const filePath = path.join(process.cwd(), doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.delete(employeeDocuments).where(eq(employeeDocuments.id, req.params.docId));
    return sendSuccess(res, null, "Dokumen berhasil dihapus");
  } catch (err) { next(err); }
};

// History
export const getSalaryHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await db.select().from(salaryHistory)
      .where(eq(salaryHistory.employeeId, req.params.id))
      .orderBy(desc(salaryHistory.effectiveDate));
    return sendSuccess(res, history);
  } catch (err) { next(err); }
};

export const getPositionHistoryList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await db.select().from(positionHistory)
      .where(eq(positionHistory.employeeId, req.params.id))
      .orderBy(desc(positionHistory.effectiveDate));
    return sendSuccess(res, history);
  } catch (err) { next(err); }
};
