import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import Payslip from "../models/payslip.js";

export const downloadPayslipPdf = async (req, res) => {
  try {
    const { id } = req.params; // payslipId
    const doc = await Payslip.findById(id).lean();
    if (!doc) return res.status(404).json({ error: "Payslip not found." });
    if (!doc.pdfUrl)
      return res.status(404).json({ error: "PDF not generated yet." });

    // build absolute path securely from the saved relative url
    const rel = doc.pdfUrl.replace(/^\/+/, ""); // strip leading slash
    const abs = path.resolve(process.cwd(), rel);

    // security guard: ensure it's inside uploads/pdfs
    const pdfRoot = path.resolve(process.cwd(), "uploads", "pdfs");
    if (!abs.startsWith(pdfRoot)) {
      return res.status(400).json({ error: "Invalid file path." });
    }

    // ensure file exists
    try {
      await fs.access(abs);
    } catch {
      return res.status(404).json({ error: "File not found." });
    }

    // set headers and stream
    const filename = path.basename(abs);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    createReadStream(abs).pipe(res);
  } catch (err) {
    console.error("downloadPayslipPdf error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const downloadPayslipPdfnew = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Payslip.findById(id).lean();
    if (!doc) return res.status(404).json({ error: "Payslip not found." });
    if (!doc.pdfUrl)
      return res.status(404).json({ error: "PDF not generated yet." });

    const rel = doc.pdfUrl.replace(/^\/+/, "");
    const abs = path.resolve(process.cwd(), rel);

    const pdfRoot = path.resolve(process.cwd(), "uploads", "pdfs");
    // Ensure it's under the intended directory (avoid prefix collisions)
    const normalizedAbs = abs + path.sep;
    const normalizedRoot = pdfRoot + path.sep;
    if (!normalizedAbs.startsWith(normalizedRoot)) {
      return res.status(400).json({ error: "Invalid file path." });
    }

    try {
      await fs.access(abs);
    } catch {
      return res.status(404).json({ error: "File not found." });
    }

    // Optional but helpful: Content-Length for reliable downloads
    const stat = await fs.stat(abs);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    const filename = path.basename(abs);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // res.setHeader("Cache-Control", "no-store"); // optional

    const stream = createReadStream(abs);
    stream.on("error", (e) => {
      console.error("Stream error:", e);
      if (!res.headersSent) res.status(500).json({ error: "Stream error." });
      else res.destroy(e);
    });
    stream.pipe(res);
  } catch (err) {
    console.error("downloadPayslipPdf error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
