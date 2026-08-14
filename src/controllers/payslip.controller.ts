import { Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { payslips, employees, payrollPeriods, departments, positions, companies } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess } from "../utils/response.util";
import { generatePayslipPdf } from "../services/pdf.service";
import { buildPayslipEmailHtml, sendPayslipEmail } from "../services/email.service";

const getPayslipWithDetails = async (payslipId: string, companyId: string) => {
  const [slip] = await db.select({
    id: payslips.id,
    periodId: payslips.periodId,
    employeeId: payslips.employeeId,
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
    bpjsEmploymentJht: payslips.bpjsEmploymentJht,
    bpjsEmploymentJp: payslips.bpjsEmploymentJp,
    pph21: payslips.pph21,
    loanDeduction: payslips.loanDeduction,
    otherDeduction: payslips.otherDeduction,
    totalDeduction: payslips.totalDeduction,
    bpjsHealthCompany: payslips.bpjsHealthCompany,
    bpjsEmploymentJkkCompany: payslips.bpjsEmploymentJkkCompany,
    bpjsEmploymentJkmCompany: payslips.bpjsEmploymentJkmCompany,
    bpjsEmploymentJhtCompany: payslips.bpjsEmploymentJhtCompany,
    bpjsEmploymentJpCompany: payslips.bpjsEmploymentJpCompany,
    netSalary: payslips.netSalary,
    workingDays: payslips.workingDays,
    presentDays: payslips.presentDays,
    sickDays: payslips.sickDays,
    permissionDays: payslips.permissionDays,
    absentDays: payslips.absentDays,
    overtimeHours: payslips.overtimeHours,
    status: payslips.status,
    emailSentAt: payslips.emailSentAt,
    notes: payslips.notes,
    // Employee
    employeeName: employees.name,
    employeeNumber: employees.employeeNumber,
    employeeEmail: employees.email,
    npwp: employees.npwp,
    taxStatus: employees.taxStatus,
    bankName: employees.bankName,
    bankAccountNumber: employees.bankAccountNumber,
    bankAccountName: employees.bankAccountName,
    departmentName: departments.name,
    positionName: positions.name,
    // Period
    periodName: payrollPeriods.name,
    paymentDate: payrollPeriods.paymentDate,
    periodYear: payrollPeriods.periodYear,
    periodMonth: payrollPeriods.periodMonth,
  })
  .from(payslips)
  .leftJoin(employees, eq(payslips.employeeId, employees.id))
  .leftJoin(payrollPeriods, eq(payslips.periodId, payrollPeriods.id))
  .leftJoin(departments, eq(employees.departmentId, departments.id))
  .leftJoin(positions, eq(employees.positionId, positions.id))
  .where(and(eq(payslips.id, payslipId), eq(payrollPeriods.companyId, companyId)))
  .limit(1);

  return slip;
};

export const getPayslipById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const slip = await getPayslipWithDetails(req.params.id, req.user!.companyId!);
    if (!slip) throw new AppError("Payslip tidak ditemukan.", 404);
    return sendSuccess(res, slip);
  } catch (err) { next(err); }
};

export const downloadPayslipPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const slip = await getPayslipWithDetails(req.params.id, companyId);
    if (!slip) throw new AppError("Payslip tidak ditemukan.", 404);

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

    const pdfBuffer = await generatePayslipPdf({
      companyName: company?.name || "Perusahaan",
      companyAddress: company?.address || "",
      companyNpwp: company?.npwp || "",
      periodName: slip.periodName || "",
      paymentDate: slip.paymentDate || "",
      employeeName: slip.employeeName || "",
      employeeNumber: slip.employeeNumber || "",
      positionName: slip.positionName || "",
      departmentName: slip.departmentName || "",
      npwp: slip.npwp || "",
      taxStatus: slip.taxStatus || "",
      bankName: slip.bankName || "",
      bankAccountNumber: slip.bankAccountNumber || "",
      workingDays: slip.workingDays || 0,
      presentDays: slip.presentDays || 0,
      sickDays: slip.sickDays || 0,
      permissionDays: slip.permissionDays || 0,
      absentDays: slip.absentDays || 0,
      overtimeHours: slip.overtimeHours || "0",
      basicSalary: slip.basicSalary,
      allowanceTransport: slip.allowanceTransport || "0",
      allowanceMeal: slip.allowanceMeal || "0",
      allowancePosition: slip.allowancePosition || "0",
      allowanceOther: slip.allowanceOther || "0",
      overtimePay: slip.overtimePay || "0",
      bonus: slip.bonus || "0",
      thr: slip.thr || "0",
      grossSalary: slip.grossSalary,
      bpjsHealthEmployee: slip.bpjsHealthEmployee || "0",
      bpjsEmploymentJht: slip.bpjsEmploymentJht || "0",
      bpjsEmploymentJp: slip.bpjsEmploymentJp || "0",
      pph21: slip.pph21 || "0",
      loanDeduction: slip.loanDeduction || "0",
      otherDeduction: slip.otherDeduction || "0",
      totalDeduction: slip.totalDeduction,
      netSalary: slip.netSalary,
    });

    const filename = `slip-gaji-${slip.employeeNumber}-${slip.periodName?.replace(/\s/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

export const sendPayslipEmailEndpoint = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const slip = await getPayslipWithDetails(req.params.id, companyId);
    if (!slip) throw new AppError("Payslip tidak ditemukan.", 404);
    if (!slip.employeeEmail) throw new AppError("Karyawan tidak memiliki alamat email.", 400);

    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

    const pdfBuffer = await generatePayslipPdf({
      companyName: company?.name || "Perusahaan",
      companyAddress: company?.address || "",
      companyNpwp: company?.npwp || "",
      periodName: slip.periodName || "",
      paymentDate: slip.paymentDate || "",
      employeeName: slip.employeeName || "",
      employeeNumber: slip.employeeNumber || "",
      positionName: slip.positionName || "",
      departmentName: slip.departmentName || "",
      npwp: slip.npwp || "",
      taxStatus: slip.taxStatus || "",
      bankName: slip.bankName || "",
      bankAccountNumber: slip.bankAccountNumber || "",
      workingDays: slip.workingDays || 0,
      presentDays: slip.presentDays || 0,
      sickDays: slip.sickDays || 0,
      permissionDays: slip.permissionDays || 0,
      absentDays: slip.absentDays || 0,
      overtimeHours: slip.overtimeHours || "0",
      basicSalary: slip.basicSalary,
      allowanceTransport: slip.allowanceTransport || "0",
      allowanceMeal: slip.allowanceMeal || "0",
      allowancePosition: slip.allowancePosition || "0",
      allowanceOther: slip.allowanceOther || "0",
      overtimePay: slip.overtimePay || "0",
      bonus: slip.bonus || "0",
      thr: slip.thr || "0",
      grossSalary: slip.grossSalary,
      bpjsHealthEmployee: slip.bpjsHealthEmployee || "0",
      bpjsEmploymentJht: slip.bpjsEmploymentJht || "0",
      bpjsEmploymentJp: slip.bpjsEmploymentJp || "0",
      pph21: slip.pph21 || "0",
      loanDeduction: slip.loanDeduction || "0",
      otherDeduction: slip.otherDeduction || "0",
      totalDeduction: slip.totalDeduction,
      netSalary: slip.netSalary,
    });

    const html = buildPayslipEmailHtml({
      employeeName: slip.employeeName || "",
      employeeNumber: slip.employeeNumber || "",
      companyName: company?.name || "Perusahaan",
      periodName: slip.periodName || "",
      paymentDate: slip.paymentDate || "",
      basicSalary: slip.basicSalary,
      grossSalary: slip.grossSalary,
      totalDeduction: slip.totalDeduction,
      netSalary: slip.netSalary,
      bankName: slip.bankName || "",
      bankAccountNumber: slip.bankAccountNumber || "",
    });

    await sendPayslipEmail({
      to: slip.employeeEmail,
      subject: `Slip Gaji ${slip.periodName} - ${company?.name}`,
      html,
      pdfBuffer,
      pdfFileName: `slip-gaji-${slip.employeeNumber}-${slip.periodName?.replace(/\s/g, "-")}.pdf`,
    });

    // Update email sent timestamp
    await db.update(payslips)
      .set({ emailSentAt: new Date(), updatedAt: new Date() })
      .where(eq(payslips.id, req.params.id));

    return sendSuccess(res, null, `Email slip gaji berhasil dikirim ke ${slip.employeeEmail}`);
  } catch (err) { next(err); }
};

export const sendAllPayslipEmails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const periodId = req.params.periodId;

    const allPayslips = await db.select({ id: payslips.id })
      .from(payslips)
      .leftJoin(payrollPeriods, eq(payslips.periodId, payrollPeriods.id))
      .where(and(eq(payslips.periodId, periodId), eq(payrollPeriods.companyId, companyId)));

    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (const slip of allPayslips) {
      try {
        const fullSlip = await getPayslipWithDetails(slip.id, companyId);
        if (!fullSlip?.employeeEmail) { failed++; continue; }

        const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

        const pdfBuffer = await generatePayslipPdf({
          companyName: company?.name || "Perusahaan",
          companyAddress: company?.address || "",
          companyNpwp: company?.npwp || "",
          periodName: fullSlip.periodName || "",
          paymentDate: fullSlip.paymentDate || "",
          employeeName: fullSlip.employeeName || "",
          employeeNumber: fullSlip.employeeNumber || "",
          positionName: fullSlip.positionName || "",
          departmentName: fullSlip.departmentName || "",
          npwp: fullSlip.npwp || "",
          taxStatus: fullSlip.taxStatus || "",
          bankName: fullSlip.bankName || "",
          bankAccountNumber: fullSlip.bankAccountNumber || "",
          workingDays: fullSlip.workingDays || 0,
          presentDays: fullSlip.presentDays || 0,
          sickDays: fullSlip.sickDays || 0,
          permissionDays: fullSlip.permissionDays || 0,
          absentDays: fullSlip.absentDays || 0,
          overtimeHours: fullSlip.overtimeHours || "0",
          basicSalary: fullSlip.basicSalary,
          allowanceTransport: fullSlip.allowanceTransport || "0",
          allowanceMeal: fullSlip.allowanceMeal || "0",
          allowancePosition: fullSlip.allowancePosition || "0",
          allowanceOther: fullSlip.allowanceOther || "0",
          overtimePay: fullSlip.overtimePay || "0",
          bonus: fullSlip.bonus || "0",
          thr: fullSlip.thr || "0",
          grossSalary: fullSlip.grossSalary,
          bpjsHealthEmployee: fullSlip.bpjsHealthEmployee || "0",
          bpjsEmploymentJht: fullSlip.bpjsEmploymentJht || "0",
          bpjsEmploymentJp: fullSlip.bpjsEmploymentJp || "0",
          pph21: fullSlip.pph21 || "0",
          loanDeduction: fullSlip.loanDeduction || "0",
          otherDeduction: fullSlip.otherDeduction || "0",
          totalDeduction: fullSlip.totalDeduction,
          netSalary: fullSlip.netSalary,
        });

        const html = buildPayslipEmailHtml({
          employeeName: fullSlip.employeeName || "",
          employeeNumber: fullSlip.employeeNumber || "",
          companyName: company?.name || "Perusahaan",
          periodName: fullSlip.periodName || "",
          paymentDate: fullSlip.paymentDate || "",
          basicSalary: fullSlip.basicSalary,
          grossSalary: fullSlip.grossSalary,
          totalDeduction: fullSlip.totalDeduction,
          netSalary: fullSlip.netSalary,
          bankName: fullSlip.bankName || "",
          bankAccountNumber: fullSlip.bankAccountNumber || "",
        });

        await sendPayslipEmail({
          to: fullSlip.employeeEmail,
          subject: `Slip Gaji ${fullSlip.periodName} - ${company?.name}`,
          html,
          pdfBuffer,
          pdfFileName: `slip-gaji-${fullSlip.employeeNumber}-${fullSlip.periodName?.replace(/\s/g, "-")}.pdf`,
        });

        await db.update(payslips)
          .set({ emailSentAt: new Date(), updatedAt: new Date() })
          .where(eq(payslips.id, slip.id));

        sent++;
      } catch (e: any) {
        failed++;
        errors.push(e.message);
      }
    }

    return sendSuccess(res, { sent, failed, errors },
      `Email berhasil dikirim: ${sent}, Gagal: ${failed}`);
  } catch (err) { next(err); }
};
