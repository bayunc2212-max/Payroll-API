import { Response, NextFunction } from "express";
import { eq, and, desc } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "../db/index";
import { payslips, employees, payrollPeriods, departments, loans, loanPayments } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess } from "../utils/response.util";

const fmt = (v: string | number | null) => Number(v || 0).toLocaleString("id-ID");

// Helper to get all payslips for a period with details
const getPeriodPayslipData = async (periodId: string, companyId: string) => {
  const [period] = await db.select().from(payrollPeriods)
    .where(and(eq(payrollPeriods.id, periodId), eq(payrollPeriods.companyId, companyId)))
    .limit(1);
  if (!period) throw new AppError("Periode tidak ditemukan.", 404);

  const data = await db.select({
    employeeName: employees.name,
    employeeNumber: employees.employeeNumber,
    departmentName: departments.name,
    taxStatus: employees.taxStatus,
    npwp: employees.npwp,
    basicSalary: payslips.basicSalary,
    allowanceTransport: payslips.allowanceTransport,
    allowanceMeal: payslips.allowanceMeal,
    allowancePosition: payslips.allowancePosition,
    allowanceOther: payslips.allowanceOther,
    overtimePay: payslips.overtimePay,
    bonus: payslips.bonus,
    thr: payslips.thr,
    grossSalary: payslips.grossSalary,
    bpjsHealthEmployee: payslips.bpjsHealthEmployee,
    bpjsHealthCompany: payslips.bpjsHealthCompany,
    bpjsEmploymentJht: payslips.bpjsEmploymentJht,
    bpjsEmploymentJhtCompany: payslips.bpjsEmploymentJhtCompany,
    bpjsEmploymentJp: payslips.bpjsEmploymentJp,
    bpjsEmploymentJpCompany: payslips.bpjsEmploymentJpCompany,
    bpjsEmploymentJkkCompany: payslips.bpjsEmploymentJkkCompany,
    bpjsEmploymentJkmCompany: payslips.bpjsEmploymentJkmCompany,
    pph21: payslips.pph21,
    loanDeduction: payslips.loanDeduction,
    otherDeduction: payslips.otherDeduction,
    totalDeduction: payslips.totalDeduction,
    netSalary: payslips.netSalary,
    overtimeHours: payslips.overtimeHours,
    presentDays: payslips.presentDays,
    sickDays: payslips.sickDays,
    permissionDays: payslips.permissionDays,
    absentDays: payslips.absentDays,
  })
  .from(payslips)
  .leftJoin(employees, eq(payslips.employeeId, employees.id))
  .leftJoin(departments, eq(employees.departmentId, departments.id))
  .where(eq(payslips.periodId, periodId))
  .orderBy(employees.name);

  return { period, data };
};

// ── REKAP GAJI ────────────────────────────────────────────────────────────────
export const getRekapGaji = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { periodId } = req.params;
    const { data, period } = await getPeriodPayslipData(periodId, companyId);
    return sendSuccess(res, { period, payslips: data });
  } catch (err) { next(err); }
};

export const exportRekapGajiExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { periodId } = req.params;
    const { data, period } = await getPeriodPayslipData(periodId, companyId);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Rekap Gaji");

    ws.addRow([`REKAP GAJI - ${period.name}`]);
    ws.addRow([]);
    ws.addRow([
      "No", "No. Karyawan", "Nama", "Departemen",
      "Gaji Pokok", "Tunjangan Transport", "Tunjangan Makan", "Tunjangan Jabatan", "Tunjangan Lain",
      "Lembur", "Bonus", "THR", "Gaji Bruto",
      "BPJS Kes (Kar)", "JHT (Kar)", "JP (Kar)", "PPh 21", "Cicilan", "Pot. Lain",
      "Total Potongan", "Gaji Bersih",
    ]);

    ws.getRow(3).font = { bold: true };
    ws.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
    ws.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };

    data.forEach((row, i) => {
      ws.addRow([
        i + 1, row.employeeNumber, row.employeeName, row.departmentName,
        Number(row.basicSalary), Number(row.allowanceTransport), Number(row.allowanceMeal),
        Number(row.allowancePosition), Number(row.allowanceOther),
        Number(row.overtimePay), Number(row.bonus), Number(row.thr), Number(row.grossSalary),
        Number(row.bpjsHealthEmployee), Number(row.bpjsEmploymentJht), Number(row.bpjsEmploymentJp),
        Number(row.pph21), Number(row.loanDeduction), Number(row.otherDeduction),
        Number(row.totalDeduction), Number(row.netSalary),
      ]);
    });

    // Format currency columns
    const currencyCols = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    currencyCols.forEach(col => {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 15;
    });
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 12;
    ws.getColumn(3).width = 25;
    ws.getColumn(4).width = 20;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="rekap-gaji-${period.name.replace(/\s/g, "-")}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ── LAPORAN BPJS ──────────────────────────────────────────────────────────────
export const exportBpjsExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { periodId } = req.params;
    const { data, period } = await getPeriodPayslipData(periodId, companyId);

    const wb = new ExcelJS.Workbook();

    // BPJS Kesehatan sheet
    const wsKes = wb.addWorksheet("BPJS Kesehatan");
    wsKes.addRow([`LAPORAN BPJS KESEHATAN - ${period.name}`]);
    wsKes.addRow([]);
    wsKes.addRow(["No", "No. Karyawan", "Nama", "Gaji Dasar", "Iuran Karyawan (1%)", "Iuran Perusahaan (4%)", "Total"]);
    wsKes.getRow(3).font = { bold: true };
    data.forEach((row, i) => {
      wsKes.addRow([
        i + 1, row.employeeNumber, row.employeeName, Number(row.basicSalary),
        Number(row.bpjsHealthEmployee), Number(row.bpjsHealthCompany),
        Number(row.bpjsHealthEmployee) + Number(row.bpjsHealthCompany),
      ]);
    });

    // BPJS Ketenagakerjaan sheet
    const wsTK = wb.addWorksheet("BPJS Ketenagakerjaan");
    wsTK.addRow([`LAPORAN BPJS KETENAGAKERJAAN - ${period.name}`]);
    wsTK.addRow([]);
    wsTK.addRow(["No", "No. Karyawan", "Nama", "Gaji Dasar", "JHT Kar", "JHT Persh", "JP Kar", "JP Persh", "JKK", "JKM", "Total Persh"]);
    wsTK.getRow(3).font = { bold: true };
    data.forEach((row, i) => {
      wsTK.addRow([
        i + 1, row.employeeNumber, row.employeeName, Number(row.basicSalary),
        Number(row.bpjsEmploymentJht), Number(row.bpjsEmploymentJhtCompany),
        Number(row.bpjsEmploymentJp), Number(row.bpjsEmploymentJpCompany),
        Number(row.bpjsEmploymentJkkCompany), Number(row.bpjsEmploymentJkmCompany),
        Number(row.bpjsEmploymentJhtCompany) + Number(row.bpjsEmploymentJpCompany) +
        Number(row.bpjsEmploymentJkkCompany) + Number(row.bpjsEmploymentJkmCompany),
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="laporan-bpjs-${period.name.replace(/\s/g, "-")}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ── BUKTI POTONG PPH 21 ───────────────────────────────────────────────────────
export const exportPph21Excel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { periodId } = req.params;
    const { data, period } = await getPeriodPayslipData(periodId, companyId);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Bukti Potong PPh 21");
    ws.addRow([`BUKTI POTONG PPH 21 - ${period.name}`]);
    ws.addRow([]);
    ws.addRow(["No", "No. Karyawan", "Nama", "NPWP", "Status Pajak", "Gaji Bruto", "PPh 21 Bulanan", "PPh 21 Tahunan (Est.)"]);
    ws.getRow(3).font = { bold: true };
    data.forEach((row, i) => {
      ws.addRow([
        i + 1, row.employeeNumber, row.employeeName, row.npwp || "-", row.taxStatus,
        Number(row.grossSalary), Number(row.pph21), Number(row.pph21) * 12,
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="pph21-${period.name.replace(/\s/g, "-")}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ── LAPORAN LEMBUR ────────────────────────────────────────────────────────────
export const exportOvertimeExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { periodId } = req.params;
    const { data, period } = await getPeriodPayslipData(periodId, companyId);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Laporan Lembur");
    ws.addRow([`LAPORAN LEMBUR - ${period.name}`]);
    ws.addRow([]);
    ws.addRow(["No", "No. Karyawan", "Nama", "Jam Lembur", "Upah Lembur"]);
    ws.getRow(3).font = { bold: true };
    data.filter(r => Number(r.overtimeHours) > 0).forEach((row, i) => {
      ws.addRow([i + 1, row.employeeNumber, row.employeeName, Number(row.overtimeHours), Number(row.overtimePay)]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="lembur-${period.name.replace(/\s/g, "-")}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ── LAPORAN KASBON ────────────────────────────────────────────────────────────
export const getLoanReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const data = await db.select({
      id: loans.id,
      employeeName: employees.name,
      employeeNumber: employees.employeeNumber,
      amount: loans.amount,
      installmentAmount: loans.installmentAmount,
      totalInstallments: loans.totalInstallments,
      paidInstallments: loans.paidInstallments,
      remainingAmount: loans.remainingAmount,
      status: loans.status,
      startDate: loans.startDate,
      createdAt: loans.createdAt,
    })
    .from(loans)
    .leftJoin(employees, eq(loans.employeeId, employees.id))
    .where(eq(employees.companyId, companyId))
    .orderBy(desc(loans.createdAt));

    return sendSuccess(res, data);
  } catch (err) { next(err); }
};

export const exportLoanExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const data = await db.select({
      employeeName: employees.name,
      employeeNumber: employees.employeeNumber,
      amount: loans.amount,
      installmentAmount: loans.installmentAmount,
      totalInstallments: loans.totalInstallments,
      paidInstallments: loans.paidInstallments,
      remainingAmount: loans.remainingAmount,
      status: loans.status,
      startDate: loans.startDate,
    })
    .from(loans)
    .leftJoin(employees, eq(loans.employeeId, employees.id))
    .where(eq(employees.companyId, companyId))
    .orderBy(employees.name);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Laporan Kasbon");
    ws.addRow(["LAPORAN KASBON & PINJAMAN"]);
    ws.addRow([]);
    ws.addRow(["No", "No. Karyawan", "Nama", "Jumlah Pinjaman", "Cicilan/Bulan", "Total Cicilan", "Cicilan Terbayar", "Sisa", "Status", "Mulai"]);
    ws.getRow(3).font = { bold: true };
    data.forEach((row, i) => {
      ws.addRow([
        i + 1, row.employeeNumber, row.employeeName,
        Number(row.amount), Number(row.installmentAmount),
        row.totalInstallments, row.paidInstallments, Number(row.remainingAmount),
        row.status, row.startDate,
      ]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="laporan-kasbon.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};
