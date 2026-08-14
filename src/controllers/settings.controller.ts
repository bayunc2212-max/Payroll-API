import { Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index";
import { bpjsConfig, taxConfig, companies } from "../db/schema/index";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { sendSuccess } from "../utils/response.util";

export const getBpjsConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [config] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);
    if (!config) throw new AppError("Konfigurasi BPJS belum diatur.", 404);
    return sendSuccess(res, config);
  } catch (err) { next(err); }
};

export const updateBpjsConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [existing] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);

    const updateData = { ...req.body, updatedAt: new Date() };
    // Convert to strings for numeric fields
    const numericFields = ['healthEmployeeRate', 'healthCompanyRate', 'healthMaxSalary',
      'jhtEmployeeRate', 'jhtCompanyRate', 'jpEmployeeRate', 'jpCompanyRate',
      'jpMaxSalary', 'jkkRate', 'jkmRate'];
    for (const field of numericFields) {
      if (updateData[field] !== undefined) updateData[field] = String(updateData[field]);
    }
    if (updateData.applyBpjs !== undefined) {
      updateData.applyBpjs = updateData.applyBpjs === true || updateData.applyBpjs === "true" || updateData.applyBpjs === 1;
    }

    let config;
    if (existing) {
      await db.update(bpjsConfig).set(updateData).where(eq(bpjsConfig.companyId, companyId));
      [config] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);
    } else {
      await db.insert(bpjsConfig).values({ id: randomUUID(), ...updateData, companyId });
      [config] = await db.select().from(bpjsConfig).where(eq(bpjsConfig.companyId, companyId)).limit(1);
    }

    return sendSuccess(res, config, "Konfigurasi BPJS berhasil diperbarui");
  } catch (err) { next(err); }
};

export const getTaxConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [config] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);
    if (!config) throw new AppError("Konfigurasi pajak belum diatur.", 404);
    return sendSuccess(res, config);
  } catch (err) { next(err); }
};

export const updateTaxConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [existing] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);

    const updateData = { ...req.body, updatedAt: new Date() };
    if (updateData.applyTax !== undefined) {
      updateData.applyTax = updateData.applyTax === true || updateData.applyTax === "true" || updateData.applyTax === 1;
    }

    let config;
    if (existing) {
      await db.update(taxConfig).set(updateData).where(eq(taxConfig.companyId, companyId));
      [config] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);
    } else {
      await db.insert(taxConfig).values({ id: randomUUID(), ...updateData, companyId });
      [config] = await db.select().from(taxConfig).where(eq(taxConfig.companyId, companyId)).limit(1);
    }

    return sendSuccess(res, config, "Konfigurasi pajak berhasil diperbarui");
  } catch (err) { next(err); }
};

export const getCompanyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company) throw new AppError("Data perusahaan tidak ditemukan.", 404);
    return sendSuccess(res, company);
  } catch (err) { next(err); }
};

export const updateCompanyProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user!.companyId!;
    const { name, address, phone, email, npwp } = req.body;
    await db.update(companies)
      .set({ name, address, phone, email, npwp, updatedAt: new Date() })
      .where(eq(companies.id, companyId));
    const [updated] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    return sendSuccess(res, updated, "Profil perusahaan berhasil diperbarui");
  } catch (err) { next(err); }
};
