# Payroll System

> 🇮🇩 **Bahasa Indonesia:** [dokumentasi.md](./dokumentasi.md)

A web-based payroll system to manage and automate the entire payroll cycle — from employee master data, attendance, loans/advances, salary calculation (BPJS, PPh 21, overtime, bonus, THR), up to payslips and reports.

## Goals

The main goal of this system is to **automate the entire payroll cycle** so that:

- Salary calculation is consistent and accurate (prorate, overtime, BPJS, PPh 21 Gross) with no manual math.
- Loan/advance installments are deducted automatically when a period is finalized.
- Payslips and reports are generated fast (PDF, email, Excel).
- Master data (employees, departments, positions, tax/BPJS configuration) is centralized and easy to manage.

## Features

- ✅ **Organization** — manage Departments & Positions (CRUD)
- ✅ **Employee Management** — full data (identity, employment, salary, BPJS, bank account) + documents + salary/position history
- ✅ **Attendance Management** — manual input per period, save row by row or in bulk
- ✅ **Loans & Advances** — create, approve, reject, detail + automatic installment history
- ✅ **Payroll** — payroll periods, automatic calculation (BPJS, PPh 21 Gross, overtime, bonus, THR), per-payslip bonus/deduction, **calculation preview**, finalize
- ✅ **Payslips** — web view + PDF export + email delivery (single/bulk)
- ✅ **Reports** — salary, BPJS, PPh 21, overtime and loan recaps — view on screen or export to Excel
- ✅ **Dashboard** — summary & 6-month payroll trend charts
- ✅ **Settings** — company profile, BPJS & PPh 21 configuration, change password

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + TanStack Query v5 + Zustand |
| Backend | Bun runtime + Express.js + TypeScript |
| Database | MySQL (Drizzle ORM) |
| Auth | JWT (access + refresh token) + bcrypt |
| PDF | PDFKit |
| Excel | ExcelJS |
| Email | Nodemailer (SMTP) |
| Charts | Recharts |

## Project Structure

This repository contains the **backend**. It is part of a Bun workspace monorepo where the `frontend/` lives in the parent folder.

```
backend/                 # ← this repository (Bun + Express)
├── src/
│   ├── index.ts          # Express bootstrap (helmet, cors, static /uploads, routes)
│   ├── db/               # Schema (MySQL), migrations, seed
│   ├── controllers/      # Endpoint logic
│   ├── routes/           # Route definitions (/api/v1/...)
│   ├── services/         # payroll.calculator, pdf.service, email.service
│   ├── middleware/       # auth, error, notFound
│   └── utils/            # Response helpers
├── drizzle.config.ts
├── uploads/              # Uploaded employee documents (git-ignored)
└── package.json

# parent folder (not in this repository)
├── frontend/             # React + Vite
│   └── src/
│       ├── api/          # Axios API functions
│       ├── pages/        # Application pages (per menu)
│       ├── components/
│       ├── store/        # Zustand state
│       └── utils/
└── package.json          # Monorepo config (workspaces)
```

## Requirements

- [Bun](https://bun.sh) v1.0+
- Local MySQL (e.g. [dbngin](https://dbngin.com), XAMPP, or MySQL Server)

## Setup & Installation (Developer)

### 1. Install Dependencies

```bash
bun install
```

### 2. Prepare the Database

1. Create an empty MySQL database, e.g. `payroll`.
2. Copy the env template:
   ```bash
   copy .env.example .env       # Windows
   # cp .env.example .env       # Linux/macOS
   ```

3. Fill in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=mysql://root:root@localhost:3306/payroll
   JWT_SECRET=random-string-at-least-32-characters
   JWT_REFRESH_SECRET=another-random-string-at-least-32-characters
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password   # Create at: myaccount.google.com/apppasswords
   SMTP_FROM=Payroll System <your-email@gmail.com>
   FRONTEND_URL=http://localhost:5173
   ```

> ⚠️ `.env` is listed in `.gitignore`. Never commit it — it holds database credentials, JWT secrets and the SMTP password.

### 3. Migrate & Seed Data

```bash
bun db:generate   # generate migrations from the schema (run after changing the schema)
bun db:migrate    # apply migrations to MySQL
bun db:seed       # seed initial data (company, admin, departments, positions, sample employees)
```

### 4. Run the Application

Run from the monorepo root (parent folder):

```bash
bun dev          # backend :3000 + frontend :5173 at the same time
bun dev:server   # backend only
bun dev:web      # frontend only
```

Or from this repository only:

```bash
bun dev          # backend with --watch on :3000
bun start        # backend without watch
```

Health check: `GET http://localhost:3000/api/health`

### 5. Verify (optional)

```bash
bunx tsc --noEmit                        # backend type-check
bun run --cwd ../frontend build          # frontend build
```

## Default Admin Account

After seeding:

- **Email:** `admin@payroll.com`
- **Password:** `admin123`

> ⚠️ Change this password immediately after the first login (Settings → Change Password)!

## User Guide

The correct usage order, following the business flow:

1. **Organization** — fill in Departments & Positions (required before creating employees).
2. **Employees** — add/edit full data: identity, position & department, base salary + allowances, BPJS flags, tax status (PTKP), bank account.
3. **Settings** — make sure Company Profile, BPJS Configuration and Tax Configuration are filled in (if empty, payroll processing fails).
4. **Attendance** — pick year/month/department, then fill in working days, present, sick, permission, absent, and overtime hours. Save row by row or use "Save All".
5. **Loans & Advances** — create a loan → Approve it. Installments are deducted automatically from salary when the period is finalized.
6. **Payroll** — create a new period, then in the period detail:
   - Click **Process Payroll** to calculate salary for all employees.
   - Use **Preview Payroll** to inspect the calculation breakdown before processing.
   - Use the 🎛 button per employee to set Bonus / THR / Other Deduction.
   - Click **Finalize** to lock the data (loan installments are recorded automatically).
   - **Send All Emails** to send payslips to every employee.
7. **Payslips** — open a payslip for the web view, download the PDF, or resend the email.
8. **Reports** — pick a period → view the data or export to Excel (salary, BPJS, PPh 21, overtime, loans).
9. **Dashboard** — monitor the summary: employee count, total payroll, PPh 21, active loans, and payroll trends.

> ⚠️ **Important:** Attendance and Loan data must be entered **before** clicking "Process Payroll", because the salary calculation consumes both.

## API Endpoints

Base URL: `http://localhost:3000`. All `/api/v1/*` routes except `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh` require a valid access token (`Authorization: Bearer <token>`).

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (public) |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (rate limited) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Current user |
| PUT | `/api/v1/auth/change-password` | Change password |

### Departments & Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/departments` · `/api/v1/positions` | List departments / positions |
| GET | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Detail |
| POST | `/api/v1/departments` · `/api/v1/positions` | Create |
| PUT | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Update |
| DELETE | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Delete |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/employees` | List employees |
| GET | `/api/v1/employees/:id` | Employee detail |
| POST | `/api/v1/employees` | Create employee |
| PUT | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Delete employee |
| GET | `/api/v1/employees/:id/documents` | List uploaded documents |
| POST | `/api/v1/employees/:id/documents` | Upload document (multipart `file`) |
| DELETE | `/api/v1/employees/:id/documents/:docId` | Delete document |
| GET | `/api/v1/employees/:id/salary-history` | Salary history |
| GET | `/api/v1/employees/:id/position-history` | Position history |

### Loans & Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/loans` · `/api/v1/loans/:id` | List / detail loans |
| POST | `/api/v1/loans` | Create loan |
| PUT | `/api/v1/loans/:id/approve` | Approve loan |
| PUT | `/api/v1/loans/:id/reject` | Reject loan |
| GET | `/api/v1/loans/:id/payments` | Loan installment history |
| GET | `/api/v1/attendance` | Attendance by period |
| POST | `/api/v1/attendance` | Upsert one attendance row |
| POST | `/api/v1/attendance/bulk` | Bulk upsert attendance |

### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payroll/periods` · `/api/v1/payroll/periods/:id` | List / detail periods |
| POST | `/api/v1/payroll/periods` | Create period |
| POST | `/api/v1/payroll/periods/:id/process` | Process payroll for the period |
| POST | `/api/v1/payroll/periods/:id/finalize` | Finalize period (records loan installments) |
| GET | `/api/v1/payroll/periods/:id/payslips` | Payslips of a period |
| PUT | `/api/v1/payroll/periods/:id/payslips/:payslipId/adjust` | Set bonus / THR / other deduction |
| POST | `/api/v1/payroll/calculate-preview` | Preview the salary calculation |

### Payslips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/payslips/:id` | Payslip detail |
| GET | `/api/v1/payslips/:id/pdf` | Download payslip PDF |
| POST | `/api/v1/payslips/:id/send-email` | Send payslip email |
| POST | `/api/v1/payslips/period/:periodId/send-all` | Send all payslip emails in a period |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/rekap-gaji/:periodId` | Salary recap (on screen) |
| GET | `/api/v1/reports/rekap-gaji/:periodId/excel` | Export salary recap |
| GET | `/api/v1/reports/bpjs/:periodId/excel` | Export BPJS recap |
| GET | `/api/v1/reports/pph21/:periodId/excel` | Export PPh 21 recap |
| GET | `/api/v1/reports/overtime/:periodId/excel` | Export overtime recap |
| GET | `/api/v1/reports/loans` · `/api/v1/reports/loans/excel` | Loan recap / export |

### Settings & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET · PUT | `/api/v1/settings/company` | Company profile |
| GET · PUT | `/api/v1/settings/bpjs` | BPJS configuration |
| GET · PUT | `/api/v1/settings/tax` | Tax (PPh 21) configuration |
| GET | `/api/v1/dashboard/summary` | Dashboard summary & 6-month trend |

## Salary Calculation

Implemented in `src/services/payroll.calculator.ts`.

- **Prorate:** `(present + sick + permission) / workingDaysInPeriod × basicSalary`
- **Overtime:** hourly rate = `basicSalary / 173`; the 1st hour = 1.5×, every following hour = 2× (if total ≤ 1 hour, all hours are billed at 1.5×)
- **BPJS Kesehatan (Health):** employee 1%, company 4% (capped at Rp 12,000,000)
- **BPJS JHT:** employee 2%, company 3.7%
- **BPJS JP:** employee 1%, company 2% (capped at Rp 9,077,600)
- **BPJS JKK / JKM (company only):** 0.24% / 0.3%
- ⚠️ BPJS is calculated from the **full basic salary**, not from the prorated salary.
- **PPh 21 (Gross / TER):** annualized (`monthly gross × 12`) → minus occupational expense (capped) → minus annual BPJS → minus PTKP → PKP (rounded down to a multiple of 1,000) → progressive annual tax → divided by 12

  | Annual PKP | Rate |
  |------------|------|
  | up to Rp 60,000,000 | 5% |
  | up to Rp 250,000,000 | 15% |
  | up to Rp 500,000,000 | 25% |
  | up to Rp 5,000,000,000 | 30% |
  | above Rp 5,000,000,000 | 35% |

- **PTKP defaults (annual):** TK/0 54jt · K/1 58.5jt · K/2 63jt · K/3 67.5jt · K/0 58.5jt · HB/0 112.5jt (and so on — editable in Settings)
- **Net salary:** `gross − (BPJS employee + PPh 21 + loan installments + other deductions)`

All BPJS rates, caps, PTKP values, and the global `applyBpjs` / `applyTax` toggles are editable in **Settings**.

## Project Security Notes

- `.gitignore` already excludes `node_modules/`, `.env`, and `uploads/` (uploaded employee documents contain personal data and must never be committed).
- `.env.example` is the only environment file that may be committed.
- If a file listed in `.gitignore` was already committed, adding it to `.gitignore` is not enough — you must untrack it:
  ```bash
  git rm -r --cached node_modules uploads
  git rm --cached .env
  git add .gitignore
  git commit -m "chore: add .gitignore and untrack node_modules/.env/uploads"
  git push
  ```
- If secrets were ever committed with real values, rotate them (JWT secrets, SMTP password, database password) — removing the file from the working tree does not remove it from git history.

## Troubleshooting

**Database connection error:**
- Make sure MySQL is running and `DATABASE_URL` in `.env` is correct (format: `mysql://user:pass@host:3306/db_name`).
- `DATABASE_URL` is required — the app throws on startup if it is missing.

**Email not being sent:**
- Gmail: enable 2FA, create an App Password, then set `SMTP_USER` & `SMTP_PASS`.
- Double-check `SMTP_HOST` and `SMTP_PORT`.

**PDF is not generated:**
- Make sure the `pdfkit` package is installed (`bun install`).

**Payroll processing fails / "BPJS or tax configuration is not set":**
- Complete the BPJS and Tax tabs in the **Settings** menu first.

**Uploaded documents are not shown:**
- The `uploads/` directory is served statically at `/uploads` and is relative to the process working directory — run the backend from the `backend/` folder so `uploads/` resolves correctly.

**Frontend lint error "couldn't find eslint.config.js":**
- The project has no ESLint config file (pre-existing issue); verify the code with `bun run --cwd frontend build` instead.
