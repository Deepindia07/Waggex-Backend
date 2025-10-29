// src/middlewares/uploadLogo.js
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
export const LOGO_DIR = path.join(UPLOADS_ROOT, "logos");
fs.mkdirSync(LOGO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = String(req.params?.id || "company")
      .replace(/[^a-z0-9_-]/gi, "_")
      .toLowerCase();
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
    file.mimetype
  );
  ok
    ? cb(null, true)
    : cb(new Error("Only image files (png, jpg, jpeg, webp) are allowed"));
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
}).single("logo");
