# Sistem Payroll

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
| Frontend | React 18 + Vite + TailwindCSS + TanStack Query v5 |
| Backend | Bun runtime + Express.js + TypeScript |
| Database | MySQL (Drizzle ORM) |
| PDF | PDFKit |
| Excel | ExcelJS |
| Email | Nodemailer (SMTP) |
| Charts | Recharts |

## Struktur Proyek

```
Payroll/
├── backend/              # Backend (Bun + Express)
│   ├── src/
│   │   ├── db/           # Schema (MySQL), migrations, seed
│   │   ├── controllers/  # Logika endpoint
│   │   ├── routes/       # Definisi API (/api/v1/...)
│   │   ├── services/     # PayrollCalculator, PDF, Email
│   │   ├── middleware/
│   │   └── utils/
│   ├── drizzle.config.ts
│   └── uploads/          # Dokumen karyawan
├── frontend/             # Frontend (React + Vite)
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
   copy backend\.env.example backend\.env    # Windows
   # cp backend/.env.example backend/.env    # Linux/macOS
   ```

3. Isi `backend/.env`:
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

### 3. Migrasi & Seed Data

```bash
bun db:generate   # generate migrasi dari schema (dijalankan saat ubah schema)
bun db:migrate    # jalankan migrasi ke MySQL
bun db:seed       # isi data awal (company, admin, departemen, jabatan, contoh karyawan)
```

### 4. Jalankan Aplikasi

```bash
bun dev          # backend :3000 + frontend :5173 sekaligus
bun dev:server   # hanya backend
bun dev:web      # hanya frontend
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

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login admin |
| GET | `/api/v1/employees` | Daftar karyawan |
| POST | `/api/v1/payroll/periods/:id/process` | Proses gaji periode |
| POST | `/api/v1/payroll/calculate-preview` | Preview perhitungan gaji |
| PUT | `/api/v1/payroll/periods/:id/payslips/:payslipId/adjust` | Atur bonus/THR/potongan slip |
| GET | `/api/v1/payslips/:id/pdf` | Download slip gaji PDF |
| POST | `/api/v1/payslips/:id/send-email` | Kirim email slip gaji |
| GET | `/api/v1/reports/rekap-gaji/:periodId/excel` | Export rekap gaji |
| GET | `/api/v1/departments` · `/api/v1/positions` | Daftar departemen / jabatan |

## Perhitungan Gaji

- **Prorate:** `(hadir + sakit + izin) / hari_kerja_periode × gaji_pokok`
- **Lembur:** Jam ke-1 = 1.5x upah/jam, selanjutnya = 2x upah/jam (upah/jam = gaji/173)
- **BPJS Kesehatan:** Karyawan 1%, Perusahaan 4% (maks Rp 12jt)
- **BPJS JHT:** Karyawan 2%, Perusahaan 3.7%
- **BPJS JP:** Karyawan 1%, Perusahaan 2% (maks Rp 9.077.600)
- **PPh 21 (Gross):** Tarif progresif 5%-35% berdasarkan PKP tahunan

## Troubleshooting

**Database connection error:**
- Pastikan MySQL berjalan dan `DATABASE_URL` di `backend/.env` benar (format: `mysql://user:pass@host:3306/nama_db`).

**Email tidak terkirim:**
- Gmail: Aktifkan 2FA, buat App Password, lalu isi `SMTP_USER` & `SMTP_PASS`.
- Cek `SMTP_HOST` dan `SMTP_PORT`.

**PDF tidak ter-generate:**
- Pastikan package `pdfkit` terinstall (`bun install`).

**Proses gaji gagal / "Konfigurasi BPJS atau Pajak belum diatur":**
- Lengkapi tab BPJS & Pajak di menu **Pengaturan** terlebih dahulu.

**Lint frontend error "couldn't find eslint.config.js":**
- Proyek belum punya file config ESLint (bug yang sudah ada sebelumnya); verifikasi kode cukup dengan `bun run --cwd frontend build`.
