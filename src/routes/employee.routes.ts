import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authenticate } from "../middleware/auth.middleware";
import {
  getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  getDocuments, uploadDocument, deleteDocument,
  getSalaryHistory, getPositionHistoryList,
} from "../controllers/employee.controller";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, PDF, DOC, atau DOCX."));
  },
});

export const employeeRouter = Router();
employeeRouter.use(authenticate);

employeeRouter.get("/", getEmployees);
employeeRouter.get("/:id", getEmployeeById);
employeeRouter.post("/", createEmployee);
employeeRouter.put("/:id", updateEmployee);
employeeRouter.delete("/:id", deleteEmployee);

// Documents
employeeRouter.get("/:id/documents", getDocuments);
employeeRouter.post("/:id/documents", upload.single("file"), uploadDocument);
employeeRouter.delete("/:id/documents/:docId", deleteDocument);

// History
employeeRouter.get("/:id/salary-history", getSalaryHistory);
employeeRouter.get("/:id/position-history", getPositionHistoryList);
