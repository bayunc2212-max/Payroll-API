import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
} from "../controllers/position.controller";

export const positionRouter = Router();
positionRouter.use(authenticate);

positionRouter.get("/", getPositions);
positionRouter.get("/:id", getPositionById);
positionRouter.post("/", createPosition);
positionRouter.put("/:id", updatePosition);
positionRouter.delete("/:id", deletePosition);
