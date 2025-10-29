import asyncHandler from "../utils/asyncHandler.js";
// import { companySchema } from "../validators/company.schema.js";
import {
  createCompanySvc,
  getCompanyByIdSvc,
} from "../services/company.service.js";
import Company from "../models/company.js";
import { companySchema } from "../validators/paySlip.schema.js";

const removeIfExists = async (absPath) => {
  try {
    await fs.unlink(absPath);
  } catch {}
};

export const createCompany = asyncHandler(async (req, res) => {
  const payload = companySchema.parse(req.body);
  const company = await createCompanySvc(payload);
  res.status(201).json(company);
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await getCompanyByIdSvc(req.params.id);
  if (!company) return res.status(404).json({ message: "Not found" });
  res.json(company);
});
