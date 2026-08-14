import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  console.log("🔄 Running migrations...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });

  await connection.end();
  console.log("✅ Migrations completed successfully!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
