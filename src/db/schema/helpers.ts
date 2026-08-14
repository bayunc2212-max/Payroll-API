import { varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const id = (name: string = "id") =>
  varchar(name, { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const createdAt = datetime("created_at").default(sql`(now())`).notNull();

export const updatedAt = datetime("updated_at").default(sql`(now())`).notNull();

export const timestamps = {
  createdAt,
  updatedAt,
};
