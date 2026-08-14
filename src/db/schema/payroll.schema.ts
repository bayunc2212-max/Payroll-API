import {
  mysqlTable,
  varchar,
  text,
  date,
  decimal,
  int,
  boolean,
  datetime,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { employees } from "./employee.schema";
import { companies } from "./auth.schema";
import { id, timestamps, createdAt, updatedAt } from "./helpers";

// ─── LOANS ────────────────────────────────────────────────────────────────────
export const loanStatusEnum = mysqlEnum("loan_status", [
  "pending",
  "approved",
  "rejected",
  "ongoing",
  "paid_off",
]);

export const loans = mysqlTable("loans", {
  id: id(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  installmentAmount: decimal("installment_amount", { precision: 15, scale: 2 }).notNull(),
  totalInstallments: int("total_installments").notNull(),
  paidInstallments: int("paid_installments").notNull().default(0),
  remainingAmount: decimal("remaining_amount", { precision: 15, scale: 2 }).notNull(),
  status: loanStatusEnum.notNull().default("pending"),
  approvedAt: datetime("approved_at"),
  startDate: date("start_date", { mode: "string" }),
  notes: text("notes"),
  ...timestamps,
});

export const loanPayments = mysqlTable("loan_payments", {
  id: id(),
  loanId: varchar("loan_id", { length: 36 })
    .references(() => loans.id, { onDelete: "cascade" })
    .notNull(),
  payslipId: varchar("payslip_id", { length: 36 }), // linked to payslip
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  installmentNumber: int("installment_number").notNull(),
  notes: text("notes"),
  createdAt,
});

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export const attendance = mysqlTable("attendance", {
  id: id(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  periodYear: int("period_year").notNull(),
  periodMonth: int("period_month").notNull(), // 1-12
  workingDays: int("working_days").notNull().default(0),
  presentDays: int("present_days").notNull().default(0),
  sickDays: int("sick_days").notNull().default(0),
  permissionDays: int("permission_days").notNull().default(0),
  absentDays: int("absent_days").notNull().default(0),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0"),
  notes: text("notes"),
  ...timestamps,
});

// ─── PAYROLL PERIODS ──────────────────────────────────────────────────────────
export const periodStatusEnum = mysqlEnum("period_status", [
  "draft",
  "processing",
  "processed",
  "finalized",
]);

export const payrollPeriods = mysqlTable("payroll_periods", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g. "Agustus 2026"
  periodYear: int("period_year").notNull(),
  periodMonth: int("period_month").notNull(), // 1-12
  startDate: date("start_date", { mode: "string" }).notNull(),
  cutOffDate: date("cut_off_date", { mode: "string" }).notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  workingDays: int("working_days").notNull().default(22),
  status: periodStatusEnum.notNull().default("draft"),
  notes: text("notes"),
  processedAt: datetime("processed_at"),
  finalizedAt: datetime("finalized_at"),
  ...timestamps,
});

// ─── PAYSLIPS ─────────────────────────────────────────────────────────────────
export const payslipStatusEnum = mysqlEnum("payslip_status", [
  "draft",
  "finalized",
]);

export const payslips = mysqlTable("payslips", {
  id: id(),
  periodId: varchar("period_id", { length: 36 })
    .references(() => payrollPeriods.id)
    .notNull(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id)
    .notNull(),

  // Earnings
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).notNull(),
  allowanceTransport: decimal("allowance_transport", { precision: 15, scale: 2 }).default("0"),
  allowanceMeal: decimal("allowance_meal", { precision: 15, scale: 2 }).default("0"),
  allowancePosition: decimal("allowance_position", { precision: 15, scale: 2 }).default("0"),
  allowanceOther: decimal("allowance_other", { precision: 15, scale: 2 }).default("0"),
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 15, scale: 2 }).default("0"),
  thr: decimal("thr", { precision: 15, scale: 2 }).default("0"),
  grossSalary: decimal("gross_salary", { precision: 15, scale: 2 }).notNull(),

  // Deductions
  bpjsHealthEmployee: decimal("bpjs_health_employee", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJht: decimal("bpjs_employment_jht", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJp: decimal("bpjs_employment_jp", { precision: 15, scale: 2 }).default("0"),
  pph21: decimal("pph21", { precision: 15, scale: 2 }).default("0"),
  loanDeduction: decimal("loan_deduction", { precision: 15, scale: 2 }).default("0"),
  otherDeduction: decimal("other_deduction", { precision: 15, scale: 2 }).default("0"),
  totalDeduction: decimal("total_deduction", { precision: 15, scale: 2 }).notNull(),

  // Company contributions
  bpjsHealthCompany: decimal("bpjs_health_company", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJkkCompany: decimal("bpjs_employment_jkk_company", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJkmCompany: decimal("bpjs_employment_jkm_company", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJhtCompany: decimal("bpjs_employment_jht_company", { precision: 15, scale: 2 }).default("0"),
  bpjsEmploymentJpCompany: decimal("bpjs_employment_jp_company", { precision: 15, scale: 2 }).default("0"),

  // Net
  netSalary: decimal("net_salary", { precision: 15, scale: 2 }).notNull(),

  // Attendance snapshot
  workingDays: int("working_days").default(0),
  presentDays: int("present_days").default(0),
  sickDays: int("sick_days").default(0),
  permissionDays: int("permission_days").default(0),
  absentDays: int("absent_days").default(0),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0"),

  status: payslipStatusEnum.notNull().default("draft"),
  emailSentAt: datetime("email_sent_at"),
  notes: text("notes"),
  ...timestamps,
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const bpjsConfig = mysqlTable("bpjs_config", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull()
    .unique(),
  // Toggle global: aktifkan potongan BPJS untuk semua karyawan
  applyBpjs: boolean("apply_bpjs").notNull().default(true),
  // Kesehatan
  healthEmployeeRate: decimal("health_employee_rate", { precision: 5, scale: 4 }).notNull().default("0.01"),
  healthCompanyRate: decimal("health_company_rate", { precision: 5, scale: 4 }).notNull().default("0.04"),
  healthMaxSalary: decimal("health_max_salary", { precision: 15, scale: 2 }).default("12000000"),
  // JHT Ketenagakerjaan
  jhtEmployeeRate: decimal("jht_employee_rate", { precision: 5, scale: 4 }).notNull().default("0.02"),
  jhtCompanyRate: decimal("jht_company_rate", { precision: 5, scale: 4 }).notNull().default("0.037"),
  // JP Ketenagakerjaan
  jpEmployeeRate: decimal("jp_employee_rate", { precision: 5, scale: 4 }).notNull().default("0.01"),
  jpCompanyRate: decimal("jp_company_rate", { precision: 5, scale: 4 }).notNull().default("0.02"),
  jpMaxSalary: decimal("jp_max_salary", { precision: 15, scale: 2 }).default("9077600"),
  // JKK
  jkkRate: decimal("jkk_rate", { precision: 5, scale: 4 }).notNull().default("0.0024"),
  // JKM
  jkmRate: decimal("jkm_rate", { precision: 5, scale: 4 }).notNull().default("0.003"),
  updatedAt,
});

export const taxConfig = mysqlTable("tax_config", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull()
    .unique(),
  // Toggle global: aktifkan potongan PPh 21 untuk semua karyawan
  applyTax: boolean("apply_tax").notNull().default(true),
  // PTKP values (annual)
  ptkpTk0: decimal("ptkp_tk0", { precision: 15, scale: 2 }).notNull().default("54000000"),
  ptkpTk1: decimal("ptkp_tk1", { precision: 15, scale: 2 }).notNull().default("58500000"),
  ptkpTk2: decimal("ptkp_tk2", { precision: 15, scale: 2 }).notNull().default("63000000"),
  ptkpTk3: decimal("ptkp_tk3", { precision: 15, scale: 2 }).notNull().default("67500000"),
  ptkpK0: decimal("ptkp_k0", { precision: 15, scale: 2 }).notNull().default("58500000"),
  ptkpK1: decimal("ptkp_k1", { precision: 15, scale: 2 }).notNull().default("63000000"),
  ptkpK2: decimal("ptkp_k2", { precision: 15, scale: 2 }).notNull().default("67500000"),
  ptkpK3: decimal("ptkp_k3", { precision: 15, scale: 2 }).notNull().default("72000000"),
  ptkpHb0: decimal("ptkp_hb0", { precision: 15, scale: 2 }).notNull().default("112500000"),
  ptkpHb1: decimal("ptkp_hb1", { precision: 15, scale: 2 }).notNull().default("117000000"),
  ptkpHb2: decimal("ptkp_hb2", { precision: 15, scale: 2 }).notNull().default("121500000"),
  ptkpHb3: decimal("ptkp_hb3", { precision: 15, scale: 2 }).notNull().default("126000000"),
  // Biaya Jabatan
  occupationalExpenseRate: decimal("occupational_expense_rate", { precision: 5, scale: 4 }).notNull().default("0.05"),
  occupationalExpenseMax: decimal("occupational_expense_max", { precision: 15, scale: 2 }).notNull().default("6000000"),
  updatedAt,
});
