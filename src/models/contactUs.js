import mongoose from "mongoose";

const contactUsSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 32,
      // E.164 or common formats; adjust to your locale if needed
      match: [/^\+?[0-9().\-\s]{7,}$/, "Invalid phone number format"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes for querying & housekeeping
contactUsSchema.index({ createdAt: -1 });
contactUsSchema.index({ email: 1, createdAt: -1 });

// Optional virtual

// Safe export across dev hot-reloads
export default mongoose.model("ContactUs", contactUsSchema);
