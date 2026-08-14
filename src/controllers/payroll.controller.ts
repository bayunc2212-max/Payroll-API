import { Response, NextFunction } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import {
  payrollPeriods, payslips, employees, attendance,
  loans, loanPayments, bpjsConfig, taxConfig,
} from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess, sendPaginated, parsePagination } from "../utils/response.util";
import { calculatePayroll } from "../services/payroll.calculator";

export const getPayrollPeriods = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

    const [data, [{ total }]] = await Promise.all([
      db.select().from(payrollPeriods)
        .where(eq(payrollPeriods.companyId, companyId))
        .orderBy(desc(payrollPeriods.periodYear), desc(payrollPeriods.periodMonth))
        .limit(limit).offset(offset),
      db.select({ total: count() }).from(payrollPeriods).where(eq(payrollPeriods.companyId, companyId)),
    ]);

    return sendPaginated(res, data, Number(total), page, limit);
  } catch (err) { next(err); }
};

export const getPeriodById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [period] = await db.select().from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, req.params.id), eq(payrollPeriods.companyId, companyId)))
      .limit(1);
    if (!period) throw new AppError("Periode tidak ditemukan.", 404);
    return sendSuccess(res, period);
  } catch (err) { next(err); }
};

export const createPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { name, periodYear, periodMonth, startDate, cutOffDate, paymentDate, workingDays, notes } = req.body;

    if (!name || !periodYear || !periodMonth || !startDate || !cutOffDate || !paymentDate) {
      throw new AppError("Data periode tidak lengkap.", 400);
    }

    // Check duplicate
    const [{ total }] = await db.select({ total: count() }).from(payrollPeriods)
      .where(and(
        eq(payrollPeriods.companyId, companyId),
        eq(payrollPeriods.periodYear, Number(periodYear)),
        eq(payrollPeriods.periodMonth, Number(periodMonth))
      ));
    if (Number(total) > 0) {
      throw new AppError("Periode penggajian untuk bulan ini sudah ada.", 400);
    }

    const periodId = randomUUID();
    await db.insert(payrollPeriods).values({
      id: periodId,
      companyId, name,
      periodYear: Number(periodYear),
      periodMonth: Number(periodMonth),
      startDate, cutOffDate, paymentDate,
      workingDays: Number(workingDays) || 22,
      notes,
    });
    const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId)).limit(1);

    return sendSuccess(res, period, "Periode penggajian berhasil dibuat", 201);
  } catch (err) { next(err); }
};

export const processPeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [period] = await db.select().from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, req.params.id), eq(payrollPeriods.companyId, companyId)))
      .limit(1);
    if (!period) throw new AppError("Periode tidak ditemukan.", 404);
    if (period.status === "finalized") throw new AppError("Periode sudah difinalisasi, tidak bisa diproses ulang.", 400);

    // Get configs
    const [bpjs] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);
    const [tax] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);

    if (!bpjs || !tax) throw new AppError("Konfigurasi BPJS atau Pajak belum diatur.", 400);

    // Build BPJS rates
    const bpjsRates = {
      healthEmployeeRate: parseFloat(bpjs.healthEmployeeRate),
      healthCompanyRate: parseFloat(bpjs.healthCompanyRate),
      healthMaxSalary: parseFloat(bpjs.healthMaxSalary || "12000000"),
      jhtEmployeeRate: parseFloat(bpjs.jhtEmployeeRate),
      jhtCompanyRate: parseFloat(bpjs.jhtCompanyRate),
      jpEmployeeRate: parseFloat(bpjs.jpEmployeeRate),
      jpCompanyRate: parseFloat(bpjs.jpCompanyRate),
      jpMaxSalary: parseFloat(bpjs.jpMaxSalary || "9077600"),
      jkkRate: parseFloat(bpjs.jkkRate),
      jkmRate: parseFloat(bpjs.jkmRate),
    };

    const taxRates = {
      ptkp: {
        tk0: parseFloat(tax.ptkpTk0), tk1: parseFloat(tax.ptkpTk1),
        tk2: parseFloat(tax.ptkpTk2), tk3: parseFloat(tax.ptkpTk3),
        k0: parseFloat(tax.ptkpK0), k1: parseFloat(tax.ptkpK1),
        k2: parseFloat(tax.ptkpK2), k3: parseFloat(tax.ptkpK3),
        hb0: parseFloat(tax.ptkpHb0), hb1: parseFloat(tax.ptkpHb1),
        hb2: parseFloat(tax.ptkpHb2), hb3: parseFloat(tax.ptkpHb3),
      },
      occupationalExpenseRate: parseFloat(tax.occupationalExpenseRate),
      occupationalExpenseMax: parseFloat(tax.occupationalExpenseMax),
    };

    // Update period status
    await db.update(payrollPeriods)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(payrollPeriods.id, period.id));

    // Get all active employees
    const activeEmployees = await db.select().from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.status, "active")));

    // Delete existing draft payslips for this period
    await db.delete(payslips)
      .where(and(eq(payslips.periodId, period.id), eq(payslips.status, "draft")));

    const processedPayslips = [];

    for (const emp of activeEmployees) {
      // Get attendance
      const [att] = await db.select().from(attendance)
        .where(and(
          eq(attendance.employeeId, emp.id),
          eq(attendance.periodYear, period.periodYear),
          eq(attendance.periodMonth, period.periodMonth)
        )).limit(1);

      // Get active loan deduction
      let loanDeduction = 0;
      let activeLoanId: string | null = null;
      const [activeLoan] = await db.select().from(loans)
        .where(and(eq(loans.employeeId, emp.id), eq(loans.status, "ongoing")))
        .limit(1);
      if (activeLoan) {
        loanDeduction = parseFloat(activeLoan.installmentAmount);
        activeLoanId = activeLoan.id;
      }

      const payData = {
        basicSalary: parseFloat(emp.basicSalary),
        allowanceTransport: parseFloat(emp.allowanceTransport || "0"),
        allowanceMeal: parseFloat(emp.allowanceMeal || "0"),
        allowancePosition: parseFloat(emp.allowancePosition || "0"),
        allowanceOther: parseFloat(emp.allowanceOther || "0"),
        taxStatus: emp.taxStatus || "TK0",
        isBpjsHealth: emp.isBpjsHealth ?? true,
        isBpjsEmployment: emp.isBpjsEmployment ?? true,
        workingDays: att?.workingDays ?? period.workingDays,
        presentDays: att?.presentDays ?? period.workingDays,
        sickDays: att?.sickDays ?? 0,
        permissionDays: att?.permissionDays ?? 0,
        absentDays: att?.absentDays ?? 0,
        overtimeHours: parseFloat(att?.overtimeHours?.toString() ?? "0"),
        bonus: 0,
        thr: 0,
        loanDeduction,
        otherDeduction: 0,
      };

      const result = calculatePayroll(payData, period.workingDays, bpjsRates, taxRates, {
        applyBpjs: bpjs.applyBpjs !== false,
        applyTax: tax.applyTax !== false,
      });

      await db.insert(payslips).values({
        id: randomUUID(),
        periodId: period.id,
        employeeId: emp.id,
        basicSalary: String(result.proratedBasicSalary),
        allowanceTransport: String(result.allowanceTransport),
        allowanceMeal: String(result.allowanceMeal),
        allowancePosition: String(result.allowancePosition),
        allowanceOther: String(result.allowanceOther),
        overtimePay: String(result.overtimePay),
        bonus: String(result.bonus),
        thr: String(result.thr),
        grossSalary: String(result.grossSalary),
        bpjsHealthEmployee: String(result.bpjsHealthEmployee),
        bpjsEmploymentJht: String(result.bpjsEmploymentJht),
        bpjsEmploymentJp: String(result.bpjsEmploymentJp),
        pph21: String(result.pph21Monthly),
        loanDeduction: String(result.loanDeduction),
        otherDeduction: String(result.otherDeduction),
        totalDeduction: String(result.totalDeduction),
        bpjsHealthCompany: String(result.bpjsHealthCompany),
        bpjsEmploymentJkkCompany: String(result.bpjsEmploymentJkk),
        bpjsEmploymentJkmCompany: String(result.bpjsEmploymentJkm),
        bpjsEmploymentJhtCompany: String(result.bpjsEmploymentJhtCompany),
        bpjsEmploymentJpCompany: String(result.bpjsEmploymentJpCompany),
        netSalary: String(result.netSalary),
        workingDays: payData.workingDays,
        presentDays: payData.presentDays,
        sickDays: payData.sickDays,
        permissionDays: payData.permissionDays,
        absentDays: payData.absentDays,
        overtimeHours: String(payData.overtimeHours),
      });

      processedPayslips.push(emp.id);
    }

    // Update period status to processed
    await db.update(payrollPeriods)
      .set({ status: "processed", processedAt: new Date(), updatedAt: new Date() })
      .where(eq(payrollPeriods.id, period.id));

    return sendSuccess(res, {
      period,
      processedCount: processedPayslips.length,
    }, `Berhasil memproses gaji untuk ${processedPayslips.length} karyawan`);
  } catch (err) { next(err); }
};

export const finalizePeriod = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [period] = await db.select().from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, req.params.id), eq(payrollPeriods.companyId, companyId)))
      .limit(1);
    if (!period) throw new AppError("Periode tidak ditemukan.", 404);
    if (period.status !== "processed") throw new AppError("Periode harus diproses terlebih dahulu sebelum difinalisasi.", 400);

    // Finalize all payslips
    await db.update(payslips)
      .set({ status: "finalized", updatedAt: new Date() })
      .where(eq(payslips.periodId, period.id));

    // Process loan deductions - record payments & update loan balances
    const periodPayslips = await db.select().from(payslips)
      .where(eq(payslips.periodId, period.id));

    for (const slip of periodPayslips) {
      if (parseFloat(slip.loanDeduction || "0") > 0) {
        const [activeLoan] = await db.select().from(loans)
          .where(and(eq(loans.employeeId, slip.employeeId), eq(loans.status, "ongoing")))
          .limit(1);

        if (activeLoan) {
          const newRemaining = Math.max(0, parseFloat(activeLoan.remainingAmount) - parseFloat(slip.loanDeduction || "0"));
          const newPaid = activeLoan.paidInstallments + 1;
          const newStatus = newRemaining <= 0 ? "paid_off" : "ongoing";

          await db.update(loans)
            .set({
              remainingAmount: String(newRemaining),
              paidInstallments: newPaid,
              status: newStatus as any,
              updatedAt: new Date(),
            })
            .where(eq(loans.id, activeLoan.id));

          await db.insert(loanPayments).values({
            loanId: activeLoan.id,
            payslipId: slip.id,
            amount: slip.loanDeduction!,
            paymentDate: period.paymentDate,
            installmentNumber: newPaid,
          });
        }
      }
    }

    // Finalize period
    await db.update(payrollPeriods)
      .set({ status: "finalized", finalizedAt: new Date(), updatedAt: new Date() })
      .where(eq(payrollPeriods.id, period.id));

    return sendSuccess(res, null, "Periode penggajian berhasil difinalisasi");
  } catch (err) { next(err); }
};

export const getPeriodPayslips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await db.select({
      id: payslips.id,
      employeeId: payslips.employeeId,
      employeeName: employees.name,
      employeeNumber: employees.employeeNumber,
      basicSalary: payslips.basicSalary,
      grossSalary: payslips.grossSalary,
      totalDeduction: payslips.totalDeduction,
      netSalary: payslips.netSalary,
      status: payslips.status,
      emailSentAt: payslips.emailSentAt,
    })
    .from(payslips)
    .leftJoin(employees, eq(payslips.employeeId, employees.id))
    .where(eq(payslips.periodId, req.params.id))
    .orderBy(employees.name);

    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

export const updatePayslipBonus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bonus, thr, otherDeduction, notes } = req.body;
    const [existing] = await db.select().from(payslips).where(eq(payslips.id, req.params.payslipId)).limit(1);
    if (!existing) throw new AppError("Payslip tidak ditemukan.", 404);
    if (existing.status === "finalized") throw new AppError("Payslip sudah difinalisasi, tidak bisa diubah.", 400);

    // Recalculate
    const newGross = parseFloat(existing.grossSalary) 
      - parseFloat(existing.bonus || "0") - parseFloat(existing.thr || "0")
      + (parseFloat(bonus) || 0) + (parseFloat(thr) || 0);

    const newTotalDeduction = parseFloat(existing.totalDeduction)
      - parseFloat(existing.otherDeduction || "0")
      + (parseFloat(otherDeduction) || 0);

    const newNet = newGross - newTotalDeduction;

    await db.update(payslips)
      .set({
        bonus: String(parseFloat(bonus) || 0),
        thr: String(parseFloat(thr) || 0),
        otherDeduction: String(parseFloat(otherDeduction) || 0),
        grossSalary: String(newGross),
        totalDeduction: String(newTotalDeduction),
        netSalary: String(Math.max(0, newNet)),
        notes,
        updatedAt: new Date(),
      })
      .where(eq(payslips.id, req.params.payslipId));
    const [updated] = await db.select().from(payslips).where(eq(payslips.id, req.params.payslipId)).limit(1);

    return sendSuccess(res, updated, "Payslip berhasil diperbarui");
  } catch (err) { next(err); }
};

export const previewCalculation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { employeeId, periodId, bonus = 0, thr = 0, otherDeduction = 0 } = req.body;

    const [emp] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    if (!emp) throw new AppError("Karyawan tidak ditemukan.", 404);

    const [period] = await db.select().from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, periodId), eq(payrollPeriods.companyId, companyId)))
      .limit(1);
    if (!period) throw new AppError("Periode tidak ditemukan.", 404);

    const [att] = await db.select().from(attendance)
      .where(and(
        eq(attendance.employeeId, emp.id),
        eq(attendance.periodYear, period.periodYear),
        eq(attendance.periodMonth, period.periodMonth)
      )).limit(1);

    const [bpjs] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);
    const [tax] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);

    if (!bpjs || !tax) throw new AppError("Konfigurasi BPJS atau Pajak belum diatur.", 400);

    let loanDeduction = 0;
    const [activeLoan] = await db.select().from(loans)
      .where(and(eq(loans.employeeId, emp.id), eq(loans.status, "ongoing")))
      .limit(1);
    if (activeLoan) loanDeduction = parseFloat(activeLoan.installmentAmount);

    const bpjsRates = {
      healthEmployeeRate: parseFloat(bpjs.healthEmployeeRate),
      healthCompanyRate: parseFloat(bpjs.healthCompanyRate),
      healthMaxSalary: parseFloat(bpjs.healthMaxSalary || "12000000"),
      jhtEmployeeRate: parseFloat(bpjs.jhtEmployeeRate),
      jhtCompanyRate: parseFloat(bpjs.jhtCompanyRate),
      jpEmployeeRate: parseFloat(bpjs.jpEmployeeRate),
      jpCompanyRate: parseFloat(bpjs.jpCompanyRate),
      jpMaxSalary: parseFloat(bpjs.jpMaxSalary || "9077600"),
      jkkRate: parseFloat(bpjs.jkkRate),
      jkmRate: parseFloat(bpjs.jkmRate),
    };

    const taxRates = {
      ptkp: {
        tk0: parseFloat(tax.ptkpTk0), tk1: parseFloat(tax.ptkpTk1),
        tk2: parseFloat(tax.ptkpTk2), tk3: parseFloat(tax.ptkpTk3),
        k0: parseFloat(tax.ptkpK0), k1: parseFloat(tax.ptkpK1),
        k2: parseFloat(tax.ptkpK2), k3: parseFloat(tax.ptkpK3),
        hb0: parseFloat(tax.ptkpHb0), hb1: parseFloat(tax.ptkpHb1),
        hb2: parseFloat(tax.ptkpHb2), hb3: parseFloat(tax.ptkpHb3),
      },
      occupationalExpenseRate: parseFloat(tax.occupationalExpenseRate),
      occupationalExpenseMax: parseFloat(tax.occupationalExpenseMax),
    };

    const result = calculatePayroll({
      basicSalary: parseFloat(emp.basicSalary),
      allowanceTransport: parseFloat(emp.allowanceTransport || "0"),
      allowanceMeal: parseFloat(emp.allowanceMeal || "0"),
      allowancePosition: parseFloat(emp.allowancePosition || "0"),
      allowanceOther: parseFloat(emp.allowanceOther || "0"),
      taxStatus: emp.taxStatus || "TK0",
      isBpjsHealth: emp.isBpjsHealth ?? true,
      isBpjsEmployment: emp.isBpjsEmployment ?? true,
      workingDays: att?.workingDays ?? period.workingDays,
      presentDays: att?.presentDays ?? period.workingDays,
      sickDays: att?.sickDays ?? 0,
      permissionDays: att?.permissionDays ?? 0,
      absentDays: att?.absentDays ?? 0,
      overtimeHours: parseFloat(att?.overtimeHours?.toString() ?? "0"),
      bonus: parseFloat(String(bonus)),
      thr: parseFloat(String(thr)),
      loanDeduction,
      otherDeduction: parseFloat(String(otherDeduction)),
    }, period.workingDays, bpjsRates, taxRates, {
      applyBpjs: bpjs.applyBpjs !== false,
      applyTax: tax.applyTax !== false,
    });

    return sendSuccess(res, result);
  } catch (err) { next(err); }
};
