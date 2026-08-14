import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, refreshAccessToken, getMe, changePassword } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, getMe);
authRouter.put("/change-password", authenticate, changePassword);
