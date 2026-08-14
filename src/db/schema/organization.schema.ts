import { mysqlTable, varchar, text } from "drizzle-orm/mysql-core";
import { companies } from "./auth.schema";
import { id, timestamps } from "./helpers";

export const departments = mysqlTable("departments", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ...timestamps,
});

export const positions = mysqlTable("positions", {
  id: id(),
  companyId: varchar("company_id", { length: 36 })
    .references(() => companies.id)
    .notNull(),
  departmentId: varchar("department_id", { length: 36 }).references(() => departments.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ...timestamps,
});
