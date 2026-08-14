import { mysqlTable, varchar, text, datetime, boolean } from "drizzle-orm/mysql-core";
import { id, timestamps, createdAt } from "./helpers";

export const companies = mysqlTable("companies", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  npwp: varchar("npwp", { length: 100 }),
  logo: varchar("logo", { length: 500 }),
  ...timestamps,
});

export const users = mysqlTable("users", {
  id: id(),
  companyId: varchar("company_id", { length: 36 }).references(() => companies.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: datetime("last_login_at"),
  ...timestamps,
});

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: id(),
  userId: varchar("user_id", { length: 36 })
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt,
});
