import { Response, NextFunction } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import { loans, loanPayments, employees } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendPaginated, parsePagination } from "../utils/response.util";

export const getLoans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const employeeId = req.query.employeeId as string | undefined;
    const status = req.query.status as string | undefined;

    const conditions = [];
    if (employeeId) conditions.push(eq(loans.employeeId, employeeId));
    if (status) conditions.push(eq(loans.status, status as any));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select({
        id: loans.id,
        employeeId: loans.employeeId,
        employeeName: employees.name,
        employeeNumber: employees.employeeNumber,
        amount: loans.amount,
        installmentAmount: loans.installmentAmount,
        totalInstallments: loans.totalInstallments,
        paidInstallments: loans.paidInstallments,
        remainingAmount: loans.remainingAmount,
        status: loans.status,
        startDate: loans.startDate,
        approvedAt: loans.approvedAt,
        notes: loans.notes,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .leftJoin(employees, eq(loans.employeeId, employees.id))
      .where(whereClause)
      .orderBy(desc(loans.createdAt))
      .limit(limit).offset(offset),
      db.select({ total: count() }).from(loans).where(whereClause),
    ]);

    return sendPaginated(res, data, Number(total), page, limit);
  } catch (err) { next(err); }
};

export const getLoanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [loan] = await db.select().from(loans).where(eq(loans.id, req.params.id)).limit(1);
    if (!loan) throw new AppError("Pinjaman tidak ditemukan.", 404);

    const payments = await db.select().from(loanPayments)
      .where(eq(loanPayments.loanId, loan.id))
      .orderBy(loanPayments.installmentNumber);

    return sendSuccess(res, { ...loan, payments });
  } catch (err) { next(err); }
};

export const createLoan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId, amount, installmentAmount, totalInstallments, startDate, notes } = req.body;

    if (!employeeId || !amount || !installmentAmount || !totalInstallments) {
      throw new AppError("Data pinjaman tidak lengkap.", 400);
    }

    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!emp) throw new AppError("Karyawan tidak ditemukan.", 404);

    // Check active loan
    const [{ total }] = await db.select({ total: count() }).from(loans)
      .where(and(eq(loans.employeeId, employeeId), eq(loans.status, "ongoing")));
    if (Number(total) > 0) {
      throw new AppError("Karyawan masih memiliki pinjaman aktif yang belum lunas.", 400);
    }

    const loanId = randomUUID();
    await db.insert(loans).values({
      id: loanId,
      employeeId,
      amount: String(amount),
      installmentAmount: String(installmentAmount),
      totalInstallments: Number(totalInstallments),
      remainingAmount: String(amount),
      startDate: startDate || null,
      notes,
    });
    const [loan] = await db.select().from(loans).where(eq(loans.id, loanId)).limit(1);

    return sendSuccess(res, loan, "Pinjaman berhasil dibuat", 201);
  } catch (err) { next(err); }
};

export const approveLoan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [loan] = await db.select().from(loans).where(eq(loans.id, req.params.id)).limit(1);
    if (!loan) throw new AppError("Pinjaman tidak ditemukan.", 404);
    if (loan.status !== "pending") throw new AppError("Hanya pinjaman dengan status pending yang bisa disetujui.", 400);

    const { startDate } = req.body;
    await db.update(loans)
      .set({
        status: "approved",
        approvedAt: new Date(),
        startDate: startDate || new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
      })
      .where(eq(loans.id, req.params.id));
    const [updated] = await db.select().from(loans).where(eq(loans.id, req.params.id)).limit(1);

    return sendSuccess(res, updated, "Pinjaman berhasil disetujui");
  } catch (err) { next(err); }
};

export const rejectLoan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [loan] = await db.select().from(loans).where(eq(loans.id, req.params.id)).limit(1);
    if (!loan) throw new AppError("Pinjaman tidak ditemukan.", 404);
    if (loan.status !== "pending") throw new AppError("Hanya pinjaman pending yang bisa ditolak.", 400);

    await db.update(loans)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(loans.id, req.params.id));
    const [updated] = await db.select().from(loans).where(eq(loans.id, req.params.id)).limit(1);

    return sendSuccess(res, updated, "Pinjaman ditolak");
  } catch (err) { next(err); }
};

export const getLoanPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await db.select().from(loanPayments)
      .where(eq(loanPayments.loanId, req.params.id))
      .orderBy(loanPayments.installmentNumber);
    return sendSuccess(res, payments);
  } catch (err) { next(err); }
};
