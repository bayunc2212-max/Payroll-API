/**
 * PayrollCalculator - Core Payroll Engine
 * Handles: Prorate, Overtime, BPJS, PPh 21 (Gross), Loan deductions
 */

export interface BpjsRates {
  healthEmployeeRate: number;
  healthCompanyRate: number;
  healthMaxSalary: number;
  jhtEmployeeRate: number;
  jhtCompanyRate: number;
  jpEmployeeRate: number;
  jpCompanyRate: number;
  jpMaxSalary: number;
  jkkRate: number;
  jkmRate: number;
}

export interface TaxRates {
  ptkp: Record<string, number>;
  occupationalExpenseRate: number;
  occupationalExpenseMax: number;
}

export interface EmployeePayData {
  basicSalary: number;
  allowanceTransport: number;
  allowanceMeal: number;
  allowancePosition: number;
  allowanceOther: number;
  taxStatus: string;
  isBpjsHealth: boolean;
  isBpjsEmployment: boolean;
  // Attendance
  workingDays: number;
  presentDays: number;
  sickDays: number;
  permissionDays: number;
  absentDays: number;
  overtimeHours: number;
  // Extra
  bonus: number;
  thr: number;
  loanDeduction: number;
  otherDeduction: number;
}

export interface PayrollResult {
  // Earnings
  basicSalary: number;
  proratedBasicSalary: number;
  allowanceTransport: number;
  allowanceMeal: number;
  allowancePosition: number;
  allowanceOther: number;
  overtimePay: number;
  bonus: number;
  thr: number;
  grossSalary: number;

  // BPJS deductions (employee)
  bpjsHealthEmployee: number;
  bpjsEmploymentJht: number;
  bpjsEmploymentJp: number;

  // BPJS contributions (company)
  bpjsHealthCompany: number;
  bpjsEmploymentJkk: number;
  bpjsEmploymentJkm: number;
  bpjsEmploymentJhtCompany: number;
  bpjsEmploymentJpCompany: number;

  // Tax
  pph21Monthly: number;
  pph21Calculation: {
    annualGross: number;
    biayaJabatan: number;
    annualBpjs: number;
    netto: number;
    ptkp: number;
    pkp: number;
    annualTax: number;
    monthlyTax: number;
  };

  // Other deductions
  loanDeduction: number;
  otherDeduction: number;
  totalDeduction: number;

  // Net
  netSalary: number;
}

// Tarif PPh 21 progresif (UU HPP 2021)
const TAX_BRACKETS = [
  { limit: 60_000_000, rate: 0.05 },
  { limit: 250_000_000, rate: 0.15 },
  { limit: 500_000_000, rate: 0.25 },
  { limit: 5_000_000_000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

export function calculateProgressiveTax(pkp: number): number {
  if (pkp <= 0) return 0;

  let tax = 0;
  let remaining = pkp;
  let previousLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = bracket.limit - previousLimit;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    previousLimit = bracket.limit;
  }

  return Math.round(tax);
}

export function calculateOvertime(basicSalary: number, overtimeHours: number): number {
  if (overtimeHours <= 0) return 0;
  // Upah lembur per jam = (1/173) * gaji pokok
  const hourlyRate = basicSalary / 173;
  let overtimePay = 0;

  // First hour: 1.5x, subsequent hours: 2x (simplified - working day overtime)
  if (overtimeHours >= 1) {
    overtimePay += hourlyRate * 1.5; // first hour
    const remainingHours = overtimeHours - 1;
    if (remainingHours > 0) {
      overtimePay += hourlyRate * 2 * remainingHours;
    }
  } else {
    overtimePay = hourlyRate * 1.5 * overtimeHours;
  }

  return Math.round(overtimePay);
}

export function calculateProrate(
  basicSalary: number,
  workingDaysInPeriod: number,
  presentDays: number,
  sickDays: number,
  permissionDays: number
): number {
  if (workingDaysInPeriod <= 0) return basicSalary;
  // Paid days = present + sick + permission (absent = unpaid)
  const paidDays = presentDays + sickDays + permissionDays;
  const prorated = (paidDays / workingDaysInPeriod) * basicSalary;
  return Math.round(prorated);
}

export function calculateBpjs(
  basicSalary: number,
  rates: BpjsRates,
  isBpjsHealth: boolean,
  isBpjsEmployment: boolean
) {
  const result = {
    // Employee
    healthEmployee: 0,
    jhtEmployee: 0,
    jpEmployee: 0,
    // Company
    healthCompany: 0,
    jkk: 0,
    jkm: 0,
    jhtCompany: 0,
    jpCompany: 0,
  };

  if (isBpjsHealth) {
    const healthBase = Math.min(basicSalary, rates.healthMaxSalary);
    result.healthEmployee = Math.round(healthBase * rates.healthEmployeeRate);
    result.healthCompany = Math.round(healthBase * rates.healthCompanyRate);
  }

  if (isBpjsEmployment) {
    // JHT
    result.jhtEmployee = Math.round(basicSalary * rates.jhtEmployeeRate);
    result.jhtCompany = Math.round(basicSalary * rates.jhtCompanyRate);

    // JP (ada batas maksimum upah)
    const jpBase = Math.min(basicSalary, rates.jpMaxSalary);
    result.jpEmployee = Math.round(jpBase * rates.jpEmployeeRate);
    result.jpCompany = Math.round(jpBase * rates.jpCompanyRate);

    // JKK & JKM (ditanggung perusahaan)
    result.jkk = Math.round(basicSalary * rates.jkkRate);
    result.jkm = Math.round(basicSalary * rates.jkmRate);
  }

  return result;
}

export function calculatePph21(
  monthlyGross: number,
  bpjsEmployeeMonthly: number,
  taxStatus: string,
  taxRates: TaxRates
): PayrollResult["pph21Calculation"] {
  const annualGross = monthlyGross * 12;
  const annualBpjs = bpjsEmployeeMonthly * 12;

  // Biaya jabatan (5% dari bruto, max 6jt/tahun)
  const biayaJabatan = Math.min(
    annualGross * taxRates.occupationalExpenseRate,
    taxRates.occupationalExpenseMax
  );

  const netto = annualGross - biayaJabatan - annualBpjs;

  const ptkpKey = taxStatus.toLowerCase().replace("/", "");
  const ptkp = taxRates.ptkp[ptkpKey] || taxRates.ptkp["tk0"] || 54_000_000;

  const pkp = Math.max(0, Math.floor((netto - ptkp) / 1000) * 1000); // dibulatkan ke bawah kelipatan 1000

  const annualTax = calculateProgressiveTax(pkp);
  const monthlyTax = Math.round(annualTax / 12);

  return {
    annualGross,
    biayaJabatan: Math.round(biayaJabatan),
    annualBpjs,
    netto: Math.round(netto),
    ptkp,
    pkp,
    annualTax,
    monthlyTax,
  };
}

export interface PayrollOptions {
  applyTax?: boolean;
  applyBpjs?: boolean;
}

export function calculatePayroll(
  data: EmployeePayData,
  periodWorkingDays: number,
  bpjsRates: BpjsRates,
  taxRates: TaxRates,
  options: PayrollOptions = {}
): PayrollResult {
  // 1. Prorate basic salary
  const proratedBasicSalary = calculateProrate(
    data.basicSalary,
    periodWorkingDays,
    data.presentDays,
    data.sickDays,
    data.permissionDays
  );

  // 2. Overtime
  const overtimePay = calculateOvertime(data.basicSalary, data.overtimeHours);

  // 3. Gross salary
  const grossSalary =
    proratedBasicSalary +
    data.allowanceTransport +
    data.allowanceMeal +
    data.allowancePosition +
    data.allowanceOther +
    overtimePay +
    data.bonus +
    data.thr;

  // 4. BPJS (calculated based on full basic salary, not prorated)
  const applyBpjs = options.applyBpjs !== false;
  const bpjs = applyBpjs
    ? calculateBpjs(data.basicSalary, bpjsRates, data.isBpjsHealth, data.isBpjsEmployment)
    : calculateBpjs(data.basicSalary, bpjsRates, false, false);

  // 5. PPh 21 (based on gross salary for the month)
  const applyTax = options.applyTax !== false;
  const totalBpjsEmployee = bpjs.healthEmployee + bpjs.jhtEmployee + bpjs.jpEmployee;
  const pph21Calc = applyTax
    ? calculatePph21(grossSalary, totalBpjsEmployee, data.taxStatus, taxRates)
    : {
        annualGross: Math.round(grossSalary * 12),
        biayaJabatan: 0,
        annualBpjs: 0,
        netto: Math.round(grossSalary * 12),
        ptkp: 0,
        pkp: 0,
        annualTax: 0,
        monthlyTax: 0,
      };

  // 6. Total deductions
  const totalDeduction =
    bpjs.healthEmployee +
    bpjs.jhtEmployee +
    bpjs.jpEmployee +
    pph21Calc.monthlyTax +
    data.loanDeduction +
    data.otherDeduction;

  // 7. Net salary
  const netSalary = Math.max(0, grossSalary - totalDeduction);

  return {
    basicSalary: data.basicSalary,
    proratedBasicSalary,
    allowanceTransport: data.allowanceTransport,
    allowanceMeal: data.allowanceMeal,
    allowancePosition: data.allowancePosition,
    allowanceOther: data.allowanceOther,
    overtimePay,
    bonus: data.bonus,
    thr: data.thr,
    grossSalary: Math.round(grossSalary),

    bpjsHealthEmployee: bpjs.healthEmployee,
    bpjsEmploymentJht: bpjs.jhtEmployee,
    bpjsEmploymentJp: bpjs.jpEmployee,

    bpjsHealthCompany: bpjs.healthCompany,
    bpjsEmploymentJkk: bpjs.jkk,
    bpjsEmploymentJkm: bpjs.jkm,
    bpjsEmploymentJhtCompany: bpjs.jhtCompany,
    bpjsEmploymentJpCompany: bpjs.jpCompany,

    pph21Monthly: pph21Calc.monthlyTax,
    pph21Calculation: pph21Calc,

    loanDeduction: data.loanDeduction,
    otherDeduction: data.otherDeduction,
    totalDeduction: Math.round(totalDeduction),

    netSalary: Math.round(netSalary),
  };
}
