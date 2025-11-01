import mongoose from "mongoose";

const LineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const PayslipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    payMonth: { type: String, required: true },
    payDate: { type: Date },

    // Attendance
    loss_days: { type: Number, default: 0 },

    // Money
    earnings: { type: [LineSchema], default: [] },
    deductions: { type: [LineSchema], default: [] },
    gross: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    net: { type: Number, required: true },

    // Optional metadata
    meta: { type: Object, default: {} },
    pdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payslip", PayslipSchema);
