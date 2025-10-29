import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true, unique: true },
    phoneno: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    logo: String,
  },
  { timestamps: true }
);

// Reasonable uniqueness: (name, zip) — tweak to your needs:

export default mongoose.model("Company", CompanySchema);
