# Sistem Payroll

> 🇬🇧 **English:** [README.md](./README.md)

Sistem penggajian (payroll) berbasis web untuk mengelola dan mengotomatisasi proses gaji karyawan — mulai dari data karyawan, absensi, kasbon/pinjaman, perhitungan gaji (BPJS, PPh 21, lembur, bonus, THR), sampai slip gaji dan laporan.

## Tujuan Sistem

Tujuan utama sistem ini adalah **mengotomatisasi seluruh siklus penggajian** agar:

- Perhitungan gaji konsisten dan akurat (prorate, lembur, BPJS, PPh 21 Gross) tanpa hitung manual.
- Potongan otomatis untuk cicilan kasbon/pinjaman saat gaji difinalisasi.
- Slip gaji & laporan dihasilkan cepat (PDF, email, Excel).
- Data master (karyawan, departemen, jabatan, konfigurasi pajak/BPJS) terpusat dan mudah dikelola.

## Fitur Lengkap

- ✅ **Organisasi** — kelola Departemen & Jabatan (CRUD)
- ✅ **Manajemen Karyawan** — data lengkap (identitas, kepegawaian, gaji, BPJS, rekening) + dokumen + riwayat gaji/jabatan
- ✅ **Manajemen Absensi** — input manual per periode, simpan per baris atau massal
- ✅ **Kasbon & Pinjaman** — tambah, setujui, tolak, detail + riwayat cicilan otomatis
- ✅ **Penggajian** — periode penggajian, hitung otomatis (BPJS, PPh 21 Gross, lembur, bonus, THR), atur bonus/potongan per slip, **preview perhitungan**, finalisasi
- ✅ **Slip Gaji** — web view + export PDF + kirim email (satuan/massal)
- ✅ **Laporan** — rekap gaji, BPJS, PPh 21, lembur, kasbon — lihat langsung atau export Excel
- ✅ **Dashboard** — ringkasan & chart trend penggajian (6 bulan)
- ✅ **Pengaturan** — profil perusahaan, konfigurasi BPJS & PPh 21, ganti password

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS + TanStack Query v5 + Zustand |
| Backend | Bun runtime + Express.js + TypeScript |
| Database | MySQL (Drizzle ORM) |
| Auth | JWT (access + refresh token) + bcrypt |
| PDF | PDFKit |
| Excel | ExcelJS |
| Email | Nodemailer (SMTP) |
| Charts | Recharts |

## Struktur Proyek

Repository ini berisi **backend**. Repository ini merupakan bagian dari monorepo Bun workspace, di mana `frontend/` berada di folder induk.

```
backend/                 # ← repository ini (Bun + Express)
├── src/
│   ├── index.ts          # Bootstrap Express (helmet, cors, static /uploads, routes)
│   ├── db/               # Schema (MySQL), migrations, seed
│   ├── controllers/      # Logika endpoint
│   ├── routes/           # Definisi API (/api/v1/...)
│   ├── services/         # payroll.calculator, pdf.service, email.service
│   ├── middleware/       # auth, error, notFound
│   └── utils/            # Response helpers
├── drizzle.config.ts
├── uploads/              # Dokumen karyawan (diabaikan git)
└── package.json

# folder induk (tidak ada di repository ini)
├── frontend/             # React + Vite
│   └── src/
│       ├── api/          # Axios API functions
│       ├── pages/        # Halaman aplikasi (per menu)
│       ├── components/
│       ├── store/        # Zustand state
│       └── utils/
└── package.json          # Monorepo config (workspaces)
```

## Prasyarat

- [Bun](https://bun.sh) v1.0+
- MySQL lokal (mis. [dbngin](https://dbngin.com), XAMPP, atau MySQL Server)

## Setup & Instalasi (Developer)

### 1. Install Dependencies

```bash
bun install
```

### 2. Siapkan Database

1. Buat database MySQL kosong, mis. `payroll`.
2. Copy template env:
   ```bash
   copy .env.example .env    # Windows
   # cp .env.example .env    # Linux/macOS
   ```

3. Isi `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=mysql://root:root@localhost:3306/payroll
   JWT_SECRET=random-string-minimal-32-karakter
   JWT_REFRESH_SECRET=random-string-lain-minimal-32-karakter
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=email@gmail.com
   SMTP_PASS=app-password-gmail    # Buat di: myaccount.google.com/apppasswords
   SMTP_FROM=Sistem Payroll <email@gmail.com>
   FRONTEND_URL=http://localhost:5173
   ```

> ⚠️ `.env` sudah terdaftar di `.gitignore`. Jangan pernah commit `.env` — isinya berisi kredensial database, JWT secret, dan password SMTP.

### 3. Migrasi & Seed Data

```bash
bun db:generate   # generate migrasi dari schema (dijalankan saat ubah schema)
bun db:migrate    # jalankan migrasi ke MySQL
bun db:seed       # isi data awal (company, admin, departemen, jabatan, contoh karyawan)
```

### 4. Jalankan Aplikasi

Jalankan dari root monorepo (folder induk):

```bash
bun dev          # backend :3000 + frontend :5173 sekaligus
bun dev:server   # hanya backend
bun dev:web      # hanya frontend
```

Atau hanya dari repository ini:

```bash
bun dev          # backend dengan --watch di :3000
bun start        # backend tanpa watch
```

Health check: `GET http://localhost:3000/api/health`

### 5. Verifikasi (opsional)

```bash
bunx tsc --noEmit                        # type-check backend
bun run --cwd ../frontend build          # build frontend
```

## Akun Admin Default

Setelah seed:

- **Email:** `admin@payroll.com`
- **Password:** `admin123`

> ⚠️ Segera ganti password setelah login pertama (Pengaturan → Ganti Password)!

## Panduan Pemakaian (User)

Urutan penggunaan yang benar sesuai alur bisnis:

1. **Organisasi** — isi Departemen & Jabatan (dibutuhkan data karyawan).
2. **Karyawan** — tambah/edit data lengkap: identitas, jabatan & departemen, gaji pokok + tunjangan, BPJS, status pajak (PTKP), rekening bank.
3. **Pengaturan** — pastikan Profil Perusahaan, Konfigurasi BPJS, dan Konfigurasi Pajak sudah terisi (jika kosong, proses gaji gagal).
4. **Absensi** — pilih tahun/bulan/departemen, isi hari kerja, hadir, sakit, izin, alpha, dan jam lembur. Simpan per baris atau "Simpan Semua".
5. **Kasbon & Pinjaman** — tambah pinjaman → Setujui. Cicilan akan terpotong otomatis dari gaji saat periode difinalisasi.
6. **Penggajian** — buat periode baru, lalu di detail periode:
   - Klik **Proses Gaji** untuk menghitung gaji semua karyawan.
   - Gunakan **Preview Gaji** untuk melihat rincian perhitungan sebelum diproses.
   - Gunakan tombol 🎛 per karyawan untuk mengatur Bonus / THR / Potongan Lain.
   - Klik **Finalisasi** untuk mengunci data (cicilan kasbon tercatat otomatis).
   - **Kirim Semua Email** untuk mengirim slip ke semua karyawan.
7. **Slip Gaji** — buka slip untuk melihat web view, unduh PDF, atau kirim ulang email.
8. **Laporan** — pilih periode → Lihat datanya atau Export Excel (rekap gaji, BPJS, PPh 21, lembur, kasbon).
9. **Dashboard** — pantau ringkasan: jumlah karyawan, total gaji, PPh 21, pinjaman aktif, dan trend penggajian.

> ⚠️ **Penting:** data Absensi & Kasbon harus diinput **sebelum** klik "Proses Gaji", karena perhitungan gaji memakai kedua data tersebut.

## API Endpoints

Base URL: `http://localhost:3000`. Semua route `/api/v1/*` kecuali `POST /api/v1/auth/login` dan `POST /api/v1/auth/refresh` membutuhkan access token yang valid (`Authorization: Bearer <token>`).

### Health

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Health check (publik) |

### Auth

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login admin (dibatasi rate limit) |
| POST | `/api/v1/auth/refresh` | Perbarui access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | User yang sedang login |
| PUT | `/api/v1/auth/change-password` | Ganti password |

### Departemen & Jabatan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/departments` · `/api/v1/positions` | Daftar departemen / jabatan |
| GET | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Detail |
| POST | `/api/v1/departments` · `/api/v1/positions` | Tambah |
| PUT | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Ubah |
| DELETE | `/api/v1/departments/:id` · `/api/v1/positions/:id` | Hapus |

### Karyawan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/employees` | Daftar karyawan |
| GET | `/api/v1/employees/:id` | Detail karyawan |
| POST | `/api/v1/employees` | Tambah karyawan |
| PUT | `/api/v1/employees/:id` | Ubah karyawan |
| DELETE | `/api/v1/employees/:id` | Hapus karyawan |
| GET | `/api/v1/employees/:id/documents` | Daftar dokumen |
| POST | `/api/v1/employees/:id/documents` | Upload dokumen (multipart `file`) |
| DELETE | `/api/v1/employees/:id/documents/:docId` | Hapus dokumen |
| GET | `/api/v1/employees/:id/salary-history` | Riwayat gaji |
| GET | `/api/v1/employees/:id/position-history` | Riwayat jabatan |

### Kasbon & Absensi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/loans` · `/api/v1/loans/:id` | Daftar / detail kasbon |
| POST | `/api/v1/loans` | Tambah kasbon |
| PUT | `/api/v1/loans/:id/approve` | Setujui kasbon |
| PUT | `/api/v1/loans/:id/reject` | Tolak kasbon |
| GET | `/api/v1/loans/:id/payments` | Riwayat cicilan kasbon |
| GET | `/api/v1/attendance` | Absensi per periode |
| POST | `/api/v1/attendance` | Simpan satu baris absensi |
| POST | `/api/v1/attendance/bulk` | Simpan absensi massal |

### Penggajian

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/payroll/periods` · `/api/v1/payroll/periods/:id` | Daftar / detail periode |
| POST | `/api/v1/payroll/periods` | Buat periode |
| POST | `/api/v1/payroll/periods/:id/process` | Proses gaji periode |
| POST | `/api/v1/payroll/periods/:id/finalize` | Finalisasi periode (mencatat cicilan kasbon) |
| GET | `/api/v1/payroll/periods/:id/payslips` | Slip gaji sebuah periode |
| PUT | `/api/v1/payroll/periods/:id/payslips/:payslipId/adjust` | Atur bonus / THR / potongan lain |
| POST | `/api/v1/payroll/calculate-preview` | Preview perhitungan gaji |

### Slip Gaji

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/payslips/:id` | Detail slip gaji |
| GET | `/api/v1/payslips/:id/pdf` | Download slip gaji PDF |
| POST | `/api/v1/payslips/:id/send-email` | Kirim email slip gaji |
| POST | `/api/v1/payslips/period/:periodId/send-all` | Kirim email slip gaji satu periode |

### Laporan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/reports/rekap-gaji/:periodId` | Rekap gaji (lihat di layar) |
| GET | `/api/v1/reports/rekap-gaji/:periodId/excel` | Export rekap gaji |
| GET | `/api/v1/reports/bpjs/:periodId/excel` | Export rekap BPJS |
| GET | `/api/v1/reports/pph21/:periodId/excel` | Export rekap PPh 21 |
| GET | `/api/v1/reports/overtime/:periodId/excel` | Export rekap lembur |
| GET | `/api/v1/reports/loans` · `/api/v1/reports/loans/excel` | Rekap kasbon / export |

### Pengaturan & Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET · PUT | `/api/v1/settings/company` | Profil perusahaan |
| GET · PUT | `/api/v1/settings/bpjs` | Konfigurasi BPJS |
| GET · PUT | `/api/v1/settings/tax` | Konfigurasi pajak (PPh 21) |
| GET | `/api/v1/dashboard/summary` | Ringkasan dashboard & trend 6 bulan |

## Perhitungan Gaji

Diimplementasikan di `src/services/payroll.calculator.ts`.

- **Prorate:** `(hadir + sakit + izin) / hari_kerja_periode × gaji_pokok`
- **Lembur:** upah/jam = `gaji_pokok / 173`; jam ke-1 = 1.5×, jam berikutnya = 2× (jika total ≤ 1 jam, semua jam dihitung 1.5×)
- **BPJS Kesehatan:** karyawan 1%, perusahaan 4% (maks Rp 12.000.000)
- **BPJS JHT:** karyawan 2%, perusahaan 3.7%
- **BPJS JP:** karyawan 1%, perusahaan 2% (maks Rp 9.077.600)
- **BPJS JKK / JKM (perusahaan):** 0.24% / 0.3%
- ⚠️ BPJS dihitung dari **gaji pokok penuh**, bukan dari gaji hasil prorate.
- **PPh 21 (Gross / TER):** disetahunkan (`gaji bruto bulanan × 12`) → dikurangi biaya jabatan (dengan batas maksimum) → dikurangi BPJS setahun → dikurangi PTKP → PKP (dibulatkan ke bawah kelipatan 1.000) → pajak progresif setahun → dibagi 12

  | PKP Tahunan | Tarif |
  |-------------|-------|
  | s.d. Rp 60.000.000 | 5% |
  | s.d. Rp 250.000.000 | 15% |
  | s.d. Rp 500.000.000 | 25% |
  | s.d. Rp 5.000.000.000 | 30% |
  | di atas Rp 5.000.000.000 | 35% |

- **Default PTKP (tahunan):** TK/0 54jt · K/1 58.5jt · K/2 63jt · K/3 67.5jt · K/0 58.5jt · HB/0 112.5jt (dst. — bisa diubah di menu **Pengaturan**)
- **Gaji netto:** `gaji bruto − (BPJS karyawan + PPh 21 + cicilan kasbon + potongan lain)`

Semua tarif BPJS, batas maksimum, nilai PTKP, serta toggle global `applyBpjs` / `applyTax` dapat diubah di menu **Pengaturan**.

## Catatan Keamanan Project

- `.gitignore` sudah mengecualikan `node_modules/`, `.env`, dan `uploads/` (dokumen karyawan berisi data pribadi dan tidak boleh di-commit).
- `.env.example` adalah satu-satunya file environment yang boleh di-commit.
- Jika file yang ada di `.gitignore` ternyata sudah pernah di-commit, menambkannya ke `.gitignore` saja tidak cukup — harus di-untrack dari index:
  ```bash
  git rm -r --cached node_modules uploads
  git rm --cached .env
  git add .gitignore
  git commit -m "chore: add .gitignore, untrack node_modules/.env/uploads"
  git push
  ```
- Jika secret pernah di-commit dengan nilai asli, rotasi nilainya (JWT secret, password SMTP, password database) — menghapus file dari working tree tidak menghapusnya dari riwayat git.

## Troubleshooting

**Database connection error:**
- Pastikan MySQL berjalan dan `DATABASE_URL` di `.env` benar (format: `mysql://user:pass@host:3306/nama_db`).
- `DATABASE_URL` wajib ada — aplikasi akan throw saat start jika tidak diisi.

**Email tidak terkirim:**
- Gmail: Aktifkan 2FA, buat App Password, lalu isi `SMTP_USER` & `SMTP_PASS`.
- Cek `SMTP_HOST` dan `SMTP_PORT`.

**PDF tidak ter-generate:**
- Pastikan package `pdfkit` terinstall (`bun install`).

**Proses gaji gagal / "Konfigurasi BPJS atau Pajak belum diatur":**
- Lengkapi tab BPJS & Pajak di menu **Pengaturan** terlebih dahulu.

**Dokumen hasil upload tidak tampil:**
- Folder `uploads/` disajikan secara statis di `/uploads` dan relatif terhadap working directory proses — jalankan backend dari folder `backend/` agar `uploads/` ter-resolve dengan benar.

**Lint frontend error "couldn't find eslint.config.js":**
- Proyek belum punya file config ESLint (bug yang sudah ada sebelumnya); verifikasi kode cukup dengan `bun run --cwd frontend build`.
