import { Response, NextFunction } from "express";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { db } from "../db/index";
import { payslips, employees, payrollPeriods, loans } from "../db/schema/index";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess } from "../utils/response.util";

export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;

    // Total active employees
    const [{ totalEmployees }] = await db
      .select({ totalEmployees: count() })
      .from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.status, "active")));

    // Active loans
    const [{ totalActiveLoans }] = await db
      .select({ totalActiveLoans: count() })
      .from(loans)
      .leftJoin(employees, eq(loans.employeeId, employees.id))
      .where(and(eq(employees.companyId, companyId), eq(loans.status, "ongoing")));

    // Last 6 periods summary
    const lastPeriods = await db
      .select({
        periodId: payrollPeriods.id,
        name: payrollPeriods.name,
        periodYear: payrollPeriods.periodYear,
        periodMonth: payrollPeriods.periodMonth,
        status: payrollPeriods.status,
        paymentDate: payrollPeriods.paymentDate,
      })
      .from(payrollPeriods)
      .where(eq(payrollPeriods.companyId, companyId))
      .orderBy(desc(payrollPeriods.periodYear), desc(payrollPeriods.periodMonth))
      .limit(6);

    // Get totals for each period
    const periodsWithTotals = await Promise.all(
      lastPeriods.map(async (p) => {
        const [{ totalGross, totalNet, totalPph21, totalBpjsEmployee, totalEmployeeCount }] = await db
          .select({
            totalGross: sum(payslips.grossSalary),
            totalNet: sum(payslips.netSalary),
            totalPph21: sum(payslips.pph21),
            totalBpjsEmployee: sum(payslips.bpjsHealthEmployee),
            totalEmployeeCount: count(),
          })
          .from(payslips)
          .where(eq(payslips.periodId, p.periodId));

        return {
          ...p,
          totalGross: Number(totalGross || 0),
          totalNet: Number(totalNet || 0),
          totalPph21: Number(totalPph21 || 0),
          totalBpjsEmployee: Number(totalBpjsEmployee || 0),
          totalEmployeeCount: Number(totalEmployeeCount || 0),
        };
      })
    );

    // Current period (latest finalized or processed)
    const currentPeriod = periodsWithTotals.find(
      p => p.status === "finalized" || p.status === "processed"
    );

    // Previous period for comparison
    const prevPeriod = periodsWithTotals.find(
      (p, i) => i > 0 && (p.status === "finalized" || p.status === "processed")
    );

    return sendSuccess(res, {
      summary: {
        totalActiveEmployees: Number(totalEmployees),
        totalActiveLoans: Number(totalActiveLoans),
        currentPeriodTotal: currentPeriod?.totalGross || 0,
        currentPeriodNet: currentPeriod?.totalNet || 0,
        currentPeriodPph21: currentPeriod?.totalPph21 || 0,
        previousPeriodTotal: prevPeriod?.totalGross || 0,
        growthPercentage: prevPeriod?.totalGross
          ? (((currentPeriod?.totalGross || 0) - prevPeriod.totalGross) / prevPeriod.totalGross * 100).toFixed(1)
          : "0",
      },
      chartData: periodsWithTotals.reverse(), // oldest to newest for chart
      recentPeriods: lastPeriods.slice(0, 5),
    });
  } catch (err) { next(err); }
};
