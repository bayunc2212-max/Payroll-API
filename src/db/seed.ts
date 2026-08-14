import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import * as schema from "./schema/index";

dotenv.config();

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("🌱 Seeding database...");

  // 1. Create company
  const companyId = randomUUID();
  await db
    .insert(schema.companies)
    .values({
      id: companyId,
      name: "PT Contoh Perusahaan",
      address: "Jl. Sudirman No. 1, Jakarta Pusat",
      phone: "021-12345678",
      email: "info@contohperusahaan.com",
      npwp: "01.234.567.8-901.000",
    });

  console.log("✅ Company created:", companyId);

  // 2. Create admin user
  const hashedPassword = await hash("admin123", 12);
  await db
    .insert(schema.users)
    .values({
      id: randomUUID(),
      companyId,
      name: "Administrator",
      email: "admin@payroll.com",
      password: hashedPassword,
      role: "admin",
    });

  console.log("✅ Admin user created: admin@payroll.com");
  console.log("   📧 Email: admin@payroll.com");
  console.log("   🔑 Password: admin123");

  // 3. Create departments
  const deptData = [
    { name: "Human Resources", description: "Departemen SDM" },
    { name: "Finance & Accounting", description: "Departemen Keuangan" },
    { name: "Information Technology", description: "Departemen IT" },
    { name: "Operations", description: "Departemen Operasional" },
    { name: "Marketing", description: "Departemen Pemasaran" },
  ];

  const departmentIds = deptData.map(() => randomUUID());
  await db
    .insert(schema.departments)
    .values(deptData.map((d, i) => ({ id: departmentIds[i], ...d, companyId })));

  console.log(`✅ ${departmentIds.length} departments created`);

  // 4. Create positions
  const positionData = [
    { name: "Manager", departmentId: departmentIds[0] },
    { name: "Staff HR", departmentId: departmentIds[0] },
    { name: "Finance Manager", departmentId: departmentIds[1] },
    { name: "Akuntan", departmentId: departmentIds[1] },
    { name: "IT Manager", departmentId: departmentIds[2] },
    { name: "Software Engineer", departmentId: departmentIds[2] },
    { name: "Operations Manager", departmentId: departmentIds[3] },
    { name: "Staff Operasional", departmentId: departmentIds[3] },
    { name: "Marketing Manager", departmentId: departmentIds[4] },
    { name: "Staff Marketing", departmentId: departmentIds[4] },
  ];

  const positionIds = positionData.map(() => randomUUID());
  await db
    .insert(schema.positions)
    .values(positionData.map((p, i) => ({ id: positionIds[i], ...p, companyId })));

  console.log(`✅ ${positionIds.length} positions created`);

  // 5. Create BPJS config
  await db.insert(schema.bpjsConfig).values({ companyId });
  console.log("✅ BPJS config created with default values");

  // 6. Create tax config
  await db.insert(schema.taxConfig).values({ companyId });
  console.log("✅ Tax config created with default PTKP values");

  // 7. Create sample employees
  const sampleEmployees = [
    {
      nik: "3201234567890001",
      employeeNumber: "EMP001",
      name: "Budi Santoso",
      gender: "male" as const,
      birthPlace: "Jakarta",
      birthDate: "1990-05-15",
      address: "Jl. Kebon Jeruk No. 10, Jakarta Barat",
      phone: "081234567890",
      email: "budi.santoso@email.com",
      maritalStatus: "married" as const,
      dependents: 1,
      taxStatus: "K1" as const,
      npwp: "12.345.678.9-001.000",
      joinDate: "2020-01-01",
      basicSalary: "8000000",
      allowanceTransport: "500000",
      allowanceMeal: "300000",
      departmentId: departmentIds[2], // IT
      positionId: positionIds[5], // Software Engineer
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountName: "Budi Santoso",
      companyId,
    },
    {
      nik: "3201234567890002",
      employeeNumber: "EMP002",
      name: "Siti Rahayu",
      gender: "female" as const,
      birthPlace: "Bandung",
      birthDate: "1992-08-20",
      address: "Jl. Gatot Subroto No. 5, Jakarta Selatan",
      phone: "081234567891",
      email: "siti.rahayu@email.com",
      maritalStatus: "single" as const,
      dependents: 0,
      taxStatus: "TK0" as const,
      joinDate: "2021-03-01",
      basicSalary: "6000000",
      allowanceTransport: "500000",
      allowanceMeal: "300000",
      departmentId: departmentIds[0], // HR
      positionId: positionIds[1], // Staff HR
      bankName: "Mandiri",
      bankAccountNumber: "0987654321",
      bankAccountName: "Siti Rahayu",
      companyId,
    },
    {
      nik: "3201234567890003",
      employeeNumber: "EMP003",
      name: "Ahmad Fauzi",
      gender: "male" as const,
      birthPlace: "Surabaya",
      birthDate: "1988-12-01",
      address: "Jl. HR Rasuna Said No. 15, Jakarta Selatan",
      phone: "081234567892",
      email: "ahmad.fauzi@email.com",
      maritalStatus: "married" as const,
      dependents: 2,
      taxStatus: "K2" as const,
      npwp: "98.765.432.1-001.000",
      joinDate: "2019-06-01",
      basicSalary: "12000000",
      allowanceTransport: "1000000",
      allowanceMeal: "500000",
      allowancePosition: "2000000",
      departmentId: departmentIds[2], // IT
      positionId: positionIds[4], // IT Manager
      bankName: "BNI",
      bankAccountNumber: "1122334455",
      bankAccountName: "Ahmad Fauzi",
      companyId,
    },
  ];

  const employeeIds = sampleEmployees.map(() => randomUUID());
  await db
    .insert(schema.employees)
    .values(sampleEmployees.map((e, i) => ({ id: employeeIds[i], ...e })));

  console.log(`✅ ${employeeIds.length} sample employees created`);

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Summary:");
  console.log(`   Admin: admin@payroll.com / admin123`);
  console.log(`   Departments: ${departmentIds.length}`);
  console.log(`   Positions: ${positionIds.length}`);
  console.log(`   Employees: ${employeeIds.length}`);

  await connection.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
