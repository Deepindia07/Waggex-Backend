// controllers/contact/submitContact.controller.js
import ContactUs from "../models/contactUs.js"; // adjust path if needed

// (Optional) tiny sanitizer
const clean = (v) => (typeof v === "string" ? v.trim() : v);

export const submitContactUs = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email, message } = req.body || {};

    // Honeypot check (bots often fill hidden fields)

    // Basic validations (server-side; schema will also validate)
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: "Email and message are required.",
      });
    }

    // Create document
    const doc = await ContactUs.create({
      firstName: clean(firstName),
      lastName: clean(lastName),
      phoneNumber: clean(phoneNumber),
      email: clean(email)?.toLowerCase(),
      message: clean(message),
    });

    // Optionally: enqueue an email/slack notification here
    // await sendContactNotification({ ...doc.toJSON() });

    return res.status(201).json({
      success: true,
      message: "Thanks for reaching out! We’ve received your message.",
      data: doc, // will be transformed by schema to include id/remove _id
    });
  } catch (err) {
    // Mongoose validation errors
    if (err?.name === "ValidationError") {
      const details = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: details,
      });
    }

    console.error("submitContactUs error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your message.",
    });
  }
};

export const downloadInspectionPdf = async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { checkType } = req.body;

    // 1. Find inspection by ID
    const inspection = await Inspection.findOne({
      where: {
        inspectionId,
        //  checkType: checkType
      },
    });

    if (!inspection) {
      return res
        .status(404)
        .json({ success: false, message: t(req.lang, "AGENT_NOT_FOUND") });
    }

    let pdfPath;

    if (checkType == "check-out") {
      if (!inspection.checkOutInspectionPdfFileName) {
        return res.status(400).json({
          success: false,
          message: t(req.lang, "NO_PDF_FILE_AVAILABLE"),
        });
      }
      pdfPath = path.join(
        process.cwd(), // project root
        "reports", // or wherever you store PDFs
        inspection?.checkOutInspectionPdfFileName
      );
    } else {
      if (!inspection.inspectionPdfFileName) {
        return res.status(400).json({
          success: false,
          message: t(req.lang, "NO_PDF_FILE_AVAILABLE"),
        });
      }

      pdfPath = path.join(
        process.cwd(), // project root
        "reports", // or wherever you store PDFs
        inspection?.inspectionPdfFileName
      );
    }

    // checkOutInspectionPdfFileName
    // 3. Send file as download
    return res.download(pdfPath, inspection.inspectionPdfFileName, (err) => {
      if (err) {
        console.error("❌ Error sending file:", err);
        res.status(500).json({
          success: false,
          message: t(req.lang, "ERROR_DOWNLOADING_FILE"),
        });
      }
    });
  } catch (error) {
    console.error("❌ Error in downloadInspectionPdf:", error);
    res
      .status(500)
      .json({ success: false, message: t(req.lang, "SERVER_ERROR") });
  }
};
