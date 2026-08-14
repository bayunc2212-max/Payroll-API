import {
  mysqlTable,
  varchar,
  text,
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { companies } from "./auth.schema";
import { departments, positions } from "./organization.schema";
import { id, timestamps, createdAt } from "./helpers";

export const employeeStatusEnum = mysqlEnum("employee_status", [
  "active",
  "inactive",
  "resigned",
  "terminated",
]);

export const genderEnum = mysqlEnum("gender", ["male", "female"]);

export const maritalStatusEnum = mysqlEnum("marital_status", [
  "single",
  "married",
  "divorced",
  "widowed",
]);

export const taxStatusEnum = mysqlEnum("tax_status", [
  "TK0", "TK1", "TK2", "TK3",
  "K0",  "K1",  "K2",  "K3",
  "HB0", "HB1", "HB2", "HB3",
]);

export const employees = mysqlTable("employees", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull(),
  departmentId: varchar("department_id", { length: 36 }).references(() => departments.id),
  positionId: varchar("position_id", { length: 36 }).references(() => positions.id),

  // Identitas
  nik: varchar("nik", { length: 64 }).notNull().unique(),
  employeeNumber: varchar("employee_number", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: genderEnum,
  birthPlace: varchar("birth_place", { length: 255 }),
  birthDate: date("birth_date", { mode: "string" }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  photo: varchar("photo", { length: 500 }),

  // Status
  maritalStatus: maritalStatusEnum.default("single"),
  dependents: int("dependents").default(0),
  taxStatus: taxStatusEnum.default("TK0"),
  npwp: varchar("npwp", { length: 100 }),

  // Kepegawaian
  joinDate: date("join_date", { mode: "string" }).notNull(),
  resignDate: date("resign_date", { mode: "string" }),
  status: employeeStatusEnum.notNull().default("active"),

  // Gaji
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).notNull().default("0"),
  allowanceTransport: decimal("allowance_transport", { precision: 15, scale: 2 }).default("0"),
  allowanceMeal: decimal("allowance_meal", { precision: 15, scale: 2 }).default("0"),
  allowancePosition: decimal("allowance_position", { precision: 15, scale: 2 }).default("0"),
  allowanceOther: decimal("allowance_other", { precision: 15, scale: 2 }).default("0"),

  // BPJS
  bpjsHealthNumber: varchar("bpjs_health_number", { length: 100 }),
  bpjsEmploymentNumber: varchar("bpjs_employment_number", { length: 100 }),
  isBpjsHealth: boolean("is_bpjs_health").default(true),
  isBpjsEmployment: boolean("is_bpjs_employment").default(true),

  // Bank
  bankName: varchar("bank_name", { length: 100 }),
  bankAccountNumber: varchar("bank_account_number", { length: 100 }),
  bankAccountName: varchar("bank_account_name", { length: 255 }),

  ...timestamps,
});

export const employeeDocuments = mysqlTable("employee_documents", {
  id: id(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(), // ktp, contract, certificate, other
  name: varchar("name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  expiryDate: date("expiry_date", { mode: "string" }),
  notes: text("notes"),
  createdAt,
});

export const salaryHistory = mysqlTable("salary_history", {
  id: id(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).notNull(),
  allowanceTransport: decimal("allowance_transport", { precision: 15, scale: 2 }).default("0"),
  allowanceMeal: decimal("allowance_meal", { precision: 15, scale: 2 }).default("0"),
  allowancePosition: decimal("allowance_position", { precision: 15, scale: 2 }).default("0"),
  allowanceOther: decimal("allowance_other", { precision: 15, scale: 2 }).default("0"),
  effectiveDate: date("effective_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt,
});

export const positionHistory = mysqlTable("position_history", {
  id: id(),
  employeeId: varchar("employee_id", { length: 36 })
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  departmentId: varchar("department_id", { length: 36 }).references(() => departments.id),
  positionId: varchar("position_id", { length: 36 }).references(() => positions.id),
  departmentName: varchar("department_name", { length: 255 }),
  positionName: varchar("position_name", { length: 255 }),
  effectiveDate: date("effective_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  createdAt,
});
