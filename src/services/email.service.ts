import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const formatCurrency = (amount: number | string): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
};

export const buildPayslipEmailHtml = (data: {
  employeeName: string;
  employeeNumber: string;
  companyName: string;
  periodName: string;
  paymentDate: string;
  basicSalary: string;
  grossSalary: string;
  totalDeduction: string;
  netSalary: string;
  bankName: string;
  bankAccountNumber: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #1e40af; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; opacity: 0.8; font-size: 14px; }
    .content { padding: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
    .info-item label { font-size: 12px; color: #888; display: block; }
    .info-item span { font-weight: bold; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .amount { text-align: right; font-family: monospace; }
    .total-row td { font-weight: bold; border-top: 2px solid #e2e8f0; }
    .net-salary { background: #1e40af; color: white; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .net-salary .label { font-size: 14px; opacity: 0.8; }
    .net-salary .amount { font-size: 28px; font-weight: bold; }
    .footer { padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.companyName}</h1>
    <p>Slip Gaji - ${data.periodName}</p>
  </div>
  
  <div class="content">
    <p>Yth. <strong>${data.employeeName}</strong>,</p>
    <p>Berikut adalah slip gaji Anda untuk periode <strong>${data.periodName}</strong>:</p>
    
    <div class="info-grid">
      <div class="info-item"><label>Nama Karyawan</label><span>${data.employeeName}</span></div>
      <div class="info-item"><label>No. Karyawan</label><span>${data.employeeNumber}</span></div>
      <div class="info-item"><label>Periode</label><span>${data.periodName}</span></div>
      <div class="info-item"><label>Tanggal Bayar</label><span>${data.paymentDate}</span></div>
    </div>
    
    <table>
      <tr><th colspan="2">Pendapatan</th></tr>
      <tr><td>Gaji Pokok</td><td class="amount">${formatCurrency(data.basicSalary)}</td></tr>
      <tr class="total-row"><td>Total Pendapatan Bruto</td><td class="amount">${formatCurrency(data.grossSalary)}</td></tr>
    </table>
    
    <table>
      <tr><th colspan="2">Potongan</th></tr>
      <tr class="total-row"><td>Total Potongan</td><td class="amount">${formatCurrency(data.totalDeduction)}</td></tr>
    </table>
    
    <div class="net-salary">
      <div class="label">GAJI BERSIH (TAKE HOME PAY)</div>
      <div class="amount">${formatCurrency(data.netSalary)}</div>
    </div>
    
    <p style="font-size:13px;color:#64748b;">
      Gaji akan ditransfer ke rekening ${data.bankName} - ${data.bankAccountNumber}
    </p>
    
    <p style="font-size:12px;color:#888;">
      Slip gaji lengkap terlampir dalam format PDF. Harap simpan sebagai arsip Anda.
    </p>
  </div>
  
  <div class="footer">
    <p>Email ini dikirim secara otomatis oleh Sistem Payroll. Jangan balas email ini.</p>
    <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
  </div>
</body>
</html>
  `;
};

export const sendPayslipEmail = async (params: {
  to: string;
  subject: string;
  html: string;
  pdfBuffer?: Buffer;
  pdfFileName?: string;
}) => {
  const transporter = createTransporter();

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM || `Sistem Payroll <${process.env.SMTP_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  };

  if (params.pdfBuffer && params.pdfFileName) {
    mailOptions.attachments = [{
      filename: params.pdfFileName,
      content: params.pdfBuffer,
      contentType: "application/pdf",
    }];
  }

  await transporter.sendMail(mailOptions);
};
