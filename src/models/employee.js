import mongoose from "mongoose";
import { number } from "zod";

const ExtraFieldSchema = new mongoose.Schema(
  { label: String, value: String },
  { _id: false }
);

const EmployeeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
      required: true,
    },
    name: { type: String, required: true },
    employeeId: { type: String, required: true },
    email: String,
    phoneno: String,
    designation: String,
    paidDays: number,
    lossOfPayDays: number,
    extraFields: [ExtraFieldSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One employeeId per company
EmployeeSchema.index({ company: 1, employeeId: 1 }, { unique: true });

export default mongoose.model("Employee", EmployeeSchema);
