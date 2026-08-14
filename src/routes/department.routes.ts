import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller";

export const departmentRouter = Router();
departmentRouter.use(authenticate);

departmentRouter.get("/", getDepartments);
departmentRouter.get("/:id", getDepartmentById);
departmentRouter.post("/", createDepartment);
departmentRouter.put("/:id", updateDepartment);
departmentRouter.delete("/:id", deleteDepartment);
