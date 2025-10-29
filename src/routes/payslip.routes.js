import { Router } from "express";
import { uploadLogo } from "../middleware/uploadLogo.js";
import { validatePayslip } from "../validators/paySlip.schema.js";
import { createPayslip } from "../controllers/payslip.controller.js";
import { normalizeMultipartFields } from "../middleware/normalizeMultipartFields.js";

const r = Router();

r.post(
  "/",
  uploadLogo, // <-- parse multipart first
  normalizeMultipartFields, // <-- convert JSON strings to objects
  validatePayslip, // <-- now your schema can read req.body
  createPayslip
);

export default r;
