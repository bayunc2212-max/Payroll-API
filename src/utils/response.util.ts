import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "Berhasil",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginated = (
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = "Berhasil"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const parsePagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(String(query.page || "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || "10"))));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};
