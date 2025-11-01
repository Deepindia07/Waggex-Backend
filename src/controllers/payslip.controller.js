// controller/payslip.controller.js
import path from "path";
import fs from "fs/promises";
import Company from "../models/company.js";
import Employee from "../models/employee.js";
import Payslip from "../models/payslip.js";

import { UPLOADS_ROOT } from "../middleware/uploadLogo.js";
import { buildHtmlFromApi, htmlToPdfBuffer } from "../utils/payslip.js";
import logger from "../utils/logger.js";

const toNumber = (v) =>
  v === undefined || v === null || v === "" ? 0 : Number(v) || 0;
const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};
const safeDate = (v) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};

export const createPayslip = async (req, res) => {
  try {
    logger.info("createPayslip 1"); // <-- use it
    const company = parseMaybeJSON(req.body.company) ?? req.body.company ?? {};
    const employee =
      parseMaybeJSON(req.body.employee) ?? req.body.employee ?? {};
    const earningsIn =
      parseMaybeJSON(req.body.earnings) ?? req.body.earnings ?? [];
    const deductIn =
      parseMaybeJSON(req.body.deductions) ?? req.body.deductions ?? [];
    const payMonth = req.body.payMonth;
    logger.info("createPayslip 2"); // <-- use it
    if (!company?.name) {
      return res.status(400).json({ error: "company.name is required" });
    }
    if (!employee?.employeeId) {
      return res.status(400).json({ error: "employee.employeeId is required" });
    }
    logger.info("createPayslip 3"); // <-- use it
    // If Multer saved a file, store public path in Mongo
    const logoPath = req.file
      ? `/uploads/logos/${req.file.filename}`
      : undefined;

    // --- 1) Upsert Company (by name + optional zip) ---
    const companyFilter = {
      name: company.name,
      ...(company.zip ? { zip: company.zip } : {}),
    };

    logger.info("createPayslip 4"); // <-- use it
    const existingCompany = await Company.findOne(companyFilter).lean();
    logger.info("createPayslip 5", existingCompany); // <-- use it
    const companyUpdate = { ...company };
    if (logoPath) companyUpdate.logo = logoPath;
    logger.info("createPayslip 6", companyUpdate); // <-- use it
    const companyDoc = await Company.findOneAndUpdate(
      companyFilter,
      { $set: companyUpdate },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info("createPayslip 7", companyDoc); // <-- use it
    // Delete old logo if replaced and inside /uploads/logos
    if (logoPath && existingCompany?.logo) {
      const projectRoot = path.join(UPLOADS_ROOT, ".."); // one up from /uploads
      const rel = existingCompany.logo.replace(/^\/+/, ""); // strip leading slash
      const oldAbs = path.join(projectRoot, rel);
      if (oldAbs.includes(path.join(UPLOADS_ROOT, "logos"))) {
        try {
          await fs.unlink(oldAbs);
        } catch {}
      }
    }

    // --- 2) Upsert Employee (scoped by company + employeeId) ---
    const employeeFilter = {
      company: companyDoc._id,
      employeeId: employee.employeeId,
    };

    const employeeDoc = await Employee.findOneAndUpdate(
      employeeFilter,
      { $set: { ...employee, company: companyDoc._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info("createPayslip 8", companyDoc); // <-- use it
    console.log("employee?.employeeId", employee?.employeeId);
    if (employee?.employeeId && employeeDoc?._id) {
      // Only update if not already set or differs
      if (
        !companyDoc.createdBy ||
        companyDoc.createdBy.toString() !== employeeDoc._id.toString()
      ) {
        await Company.updateOne(
          { _id: companyDoc._id },
          { $set: { createdBy: employeeDoc._id } }
        );
      }
    }
    logger.info("createPayslip 9"); // <-- use it
    // --- 3) Compute totals ---
    const arr = (x) => (Array.isArray(x) ? x : []);
    const normEarnings = arr(earningsIn).map((l) => ({
      label: (l?.label ?? "").toString(),
      amount: toNumber(l?.amount),
    }));
    const normDeductions = arr(deductIn).map((l) => ({
      label: (l?.label ?? "").toString(),
      amount: toNumber(l?.amount),
    }));

    const gross = normEarnings.reduce((s, l) => s + toNumber(l.amount), 0);
    const totalDeductions = normDeductions.reduce(
      (s, l) => s + toNumber(l.amount),
      0
    );
    const net = gross - totalDeductions;
    logger.info("createPayslip 10"); // <-- use it
    // --- 4) Build payslip payload ---
    const payslipPayload = {
      company: companyDoc._id,
      employee: employeeDoc._id,
      payPeriod: employee?.payPeriod || "",
      payDate: employee?.payDate ? safeDate(employee.payDate) : undefined,
      paid_days: toNumber(employee?.paid_days),
      loss_days: toNumber(employee?.loss_days),
      earnings: normEarnings,
      deductions: normDeductions,
      payMonth: payMonth,
      gross,
      totalDeductions,
      net,
    };
    const payslipDoc = await Payslip.create(payslipPayload);

    // (optional) populate if your template needs company/employee fields
    const populated = await Payslip.findById(payslipDoc._id)
      .populate("company")
      .populate("employee");

    // 2) Build HTML for PDF
    const html = await buildHtmlFromApi({
      company: populated.company, // make sure your builder expects this shape
      employee: populated.employee, // or modify builder accordingly
      payslip: populated,
    });
    logger.info("createPayslip 11"); // <-- use it
    // 3) Render PDF
    const pdf = await htmlToPdfBuffer(html);

    // 4) Save to disk (uploads/pdfs/payslip-<id>.pdf)
    const idStr = payslipDoc._id.toString();
    const outDir = path.join(process.cwd(), "uploads", "pdfs");
    await fs.mkdir(outDir, { recursive: true });

    const fileName = `payslip-${idStr}.pdf`;
    const filePath = path.join(outDir, fileName);
    await fs.writeFile(filePath, pdf);

    // ==========

    // >>> SAVE PATH (relative URL) into pdfUrl
    const relativeUrl = `/uploads/pdfs/${fileName}`;
    await Payslip.updateOne(
      { _id: payslipDoc._id },
      { $set: { pdfUrl: relativeUrl } }
    );

    // ==========
    // 5) Build a PUBLIC URL (served via /static)
    const publicUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/pdfs/${encodeURIComponent(fileName)}`;
    // 6) Return JSON (convert doc to plain object)
    return res.status(201).json({
      ...populated.toObject(), // or payslipDoc.toObject() if you don't need populated fields in response
      pdfUrl: publicUrl,
    });
  } catch (err) {
    console.log("error", err);
    // Clean up newly uploaded file if DB op fails
    if (req.file) {
      try {
        await fs.unlink(path.join(UPLOADS_ROOT, "logos", req.file.filename));
      } catch {}
    }
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Max 1MB." });
    }
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: "Duplicate record", details: err.keyValue });
    }
    console.error("createPayslip error:", err);
    return res.status(500).json({ error: "Internal Server Error", err });
  }
};
