import PDFDocument from "pdfkit";

export interface PayslipPdfData {
  companyName: string;
  companyAddress: string;
  companyNpwp: string;
  periodName: string;
  paymentDate: string;
  employeeName: string;
  employeeNumber: string;
  positionName: string;
  departmentName: string;
  npwp: string;
  taxStatus: string;
  bankName: string;
  bankAccountNumber: string;
  // Attendance
  workingDays: number;
  presentDays: number;
  sickDays: number;
  permissionDays: number;
  absentDays: number;
  overtimeHours: string;
  // Earnings
  basicSalary: string;
  allowanceTransport: string;
  allowanceMeal: string;
  allowancePosition: string;
  allowanceOther: string;
  overtimePay: string;
  bonus: string;
  thr: string;
  grossSalary: string;
  // Deductions
  bpjsHealthEmployee: string;
  bpjsEmploymentJht: string;
  bpjsEmploymentJp: string;
  pph21: string;
  loanDeduction: string;
  otherDeduction: string;
  totalDeduction: string;
  // Net
  netSalary: string;
}

const fmt = (amount: string | number): string => {
  return new Intl.NumberFormat("id-ID").format(Number(amount));
};

export const generatePayslipPdf = (data: PayslipPdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 80; // with margins

    // ── HEADER ─────────────────────────────────────────────────────
    doc.rect(40, 40, pageWidth, 80).fill("#1e40af");
    doc.fillColor("white").fontSize(18).font("Helvetica-Bold")
      .text(data.companyName, 56, 56, { width: pageWidth - 32 });
    doc.fontSize(10).font("Helvetica")
      .text(`SLIP GAJI - ${data.periodName.toUpperCase()}`, 56, 82);
    doc.moveDown(0.5);

    doc.fillColor("#1e293b");
    doc.y = 140;

    // ── EMPLOYEE INFO ───────────────────────────────────────────────
    const col1 = 40, col2 = 320;
    const addInfoRow = (label: string, value: string, x: number, y: number) => {
      doc.fontSize(9).font("Helvetica").fillColor("#64748b").text(label, x, y);
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e293b").text(value, x, y + 13);
    };

    const infoY = doc.y;
    addInfoRow("Nama Karyawan", data.employeeName, col1, infoY);
    addInfoRow("No. Karyawan", data.employeeNumber, col2, infoY);
    addInfoRow("Jabatan", data.positionName || "-", col1, infoY + 36);
    addInfoRow("Departemen", data.departmentName || "-", col2, infoY + 36);
    addInfoRow("NPWP", data.npwp || "-", col1, infoY + 72);
    addInfoRow("Status Pajak", data.taxStatus || "-", col2, infoY + 72);
    addInfoRow("Bank", `${data.bankName || "-"} - ${data.bankAccountNumber || "-"}`, col1, infoY + 108);
    addInfoRow("Tanggal Bayar", data.paymentDate, col2, infoY + 108);

    doc.y = infoY + 145;

    // ── ATTENDANCE ──────────────────────────────────────────────────
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e40af")
      .text("Kehadiran", 40, doc.y);
    doc.moveTo(40, doc.y + 2).lineTo(40 + pageWidth, doc.y + 2).stroke("#e2e8f0");
    doc.moveDown(0.4);

    const attY = doc.y;
    const attCols = ["Hari Kerja", "Hadir", "Sakit", "Izin", "Alpha", "Lembur (jam)"];
    const attVals = [
      String(data.workingDays), String(data.presentDays), String(data.sickDays),
      String(data.permissionDays), String(data.absentDays), data.overtimeHours,
    ];
    const attColW = pageWidth / attCols.length;
    attCols.forEach((col, i) => {
      doc.fontSize(9).font("Helvetica").fillColor("#64748b").text(col, 40 + i * attColW, attY);
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(attVals[i], 40 + i * attColW, attY + 14);
    });
    doc.y = attY + 35;
    doc.moveDown(0.5);

    // ── TABLE HELPER ────────────────────────────────────────────────
    const drawTable = (title: string, rows: [string, string][], totalRow?: [string, string]) => {
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e40af").text(title, 40, doc.y);
      doc.moveTo(40, doc.y + 2).lineTo(40 + pageWidth, doc.y + 2).stroke("#e2e8f0");
      doc.moveDown(0.3);

      rows.forEach(([label, value]) => {
        if (!value || value === "0") return;
        const rowY = doc.y;
        doc.fontSize(10).font("Helvetica").fillColor("#374151").text(label, 56, rowY, { width: 300 });
        doc.fontSize(10).font("Helvetica").fillColor("#374151")
          .text(`Rp ${fmt(value)}`, 40 + pageWidth - 130, rowY, { width: 130, align: "right" });
        doc.moveDown(0.35);
      });

      if (totalRow) {
        doc.moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).stroke("#cbd5e1");
        doc.moveDown(0.2);
        const rowY = doc.y;
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(totalRow[0], 56, rowY, { width: 300 });
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b")
          .text(`Rp ${fmt(totalRow[1])}`, 40 + pageWidth - 130, rowY, { width: 130, align: "right" });
        doc.moveDown(0.5);
      }
      doc.moveDown(0.5);
    };

    drawTable("Pendapatan", [
      ["Gaji Pokok", data.basicSalary],
      ["Tunjangan Transport", data.allowanceTransport],
      ["Tunjangan Makan", data.allowanceMeal],
      ["Tunjangan Jabatan", data.allowancePosition],
      ["Tunjangan Lainnya", data.allowanceOther],
      ["Upah Lembur", data.overtimePay],
      ["Bonus", data.bonus],
      ["THR", data.thr],
    ], ["Total Pendapatan Bruto", data.grossSalary]);

    drawTable("Potongan", [
      ["BPJS Kesehatan (karyawan)", data.bpjsHealthEmployee],
      ["BPJS Ketenagakerjaan JHT", data.bpjsEmploymentJht],
      ["BPJS Ketenagakerjaan JP", data.bpjsEmploymentJp],
      ["PPh 21", data.pph21],
      ["Cicilan Kasbon/Pinjaman", data.loanDeduction],
      ["Potongan Lainnya", data.otherDeduction],
    ], ["Total Potongan", data.totalDeduction]);

    // ── NET SALARY BOX ──────────────────────────────────────────────
    const boxY = doc.y;
    doc.rect(40, boxY, pageWidth, 50).fill("#1e40af");
    doc.fontSize(11).font("Helvetica").fillColor("white")
      .text("GAJI BERSIH (TAKE HOME PAY)", 56, boxY + 10);
    doc.fontSize(18).font("Helvetica-Bold").fillColor("white")
      .text(`Rp ${fmt(data.netSalary)}`, 56, boxY + 26, { width: pageWidth - 32, align: "right" });

    doc.y = boxY + 65;

    // ── FOOTER ──────────────────────────────────────────────────────
    doc.fontSize(9).font("Helvetica").fillColor("#94a3b8")
      .text("Dokumen ini digenerate secara otomatis oleh Sistem Payroll. Tidak memerlukan tanda tangan.", 40, doc.y, {
        width: pageWidth, align: "center",
      });

    doc.end();
  });
};
