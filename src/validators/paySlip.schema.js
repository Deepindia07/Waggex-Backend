// validation.js
import { z } from "zod";

/* ---------- shared ---------- */
const lineItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().nonnegative().default(0),
});

/* ---------- company (matches your payload keys) ---------- */
// accepts {name, phoneno, address, city, state, country, zip, logo}
// also tolerates {phone}->phoneno and {logoUrl}->logo
const companyBaseSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  phoneno: z.string().optional(),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  logo: z.string().url().optional().or(z.literal("")),
});

export const companySchema = z.preprocess((val) => {
  if (val && typeof val === "object") {
    const v = { ...val };
    if (v.phone && !v.phoneno) v.phoneno = v.phone;
    if (v.logoUrl && !v.logo) v.logo = v.logoUrl;
    return v;
  }
  return val;
}, companyBaseSchema);

/* ---------- employee (matches your payload keys) ---------- */
const extraFieldSchema = z.object({
  label: z.string().min(1, "Extra field label is required"),
  value: z.string().default(""),
});

export const employeeSchema = z.object({
  name: z.string().min(1, "Employee name is required"),
  employeeId: z.string().min(1, "employeeId is required"),
  email: z.string().email().optional(),
  phoneno: z.string().optional(),
  designation: z.string().optional(),
  paidDays: z.coerce.number().int().nonnegative().optional().default(0),
  lossOfPayDays: z.coerce.number().int().nonnegative().optional().default(0),
  payDate: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.date().optional()
  ),

  extraFields: z.array(extraFieldSchema).optional().default([]),
});

/* ---------- full payslip request ---------- */
const parseJSONIfString = (schema) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, schema);
export const payslipRequestSchema = z.object({
  company: parseJSONIfString(companySchema),
  employee: parseJSONIfString(employeeSchema),
  earnings: parseJSONIfString(z.array(lineItemSchema)).optional().default([]),
  deductions: parseJSONIfString(z.array(lineItemSchema)).optional().default([]),
  payMonth: z.string().min(1),
  meta: parseJSONIfString(z.record(z.any())).optional(),
});
/* ---------- express middleware ---------- */
export function validatePayslip(req, res, next) {
  try {
    req.body = payslipRequestSchema.parse(req.body); // sanitized & coerced
    return next();
  } catch (err) {
    return res.status(400).json({
      error: "Validation failed",
      details: err?.issues ?? err?.message ?? err,
    });
  }
}
